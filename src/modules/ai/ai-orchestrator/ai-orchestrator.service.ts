import { plantIdentificationService } from '../plant-identification/plant-identification.service.js';
import { cropNormalizationService } from '../crop-normalization/crop-normalization.service.js';
import { diseaseDetectionService } from '../disease-detection/disease-detection.service.js';
import { leafDetectionService } from '../leaf-detection/leaf-detection.service.js';
import { LeafDetectionResult } from '../leaf-detection/leaf-detection.types.js';
import { UnifiedPlantAnalysisResponse } from './ai-orchestrator.types.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

export class AiOrchestratorService {
  /** Reshapes a Stage 1 result into the slice the response carries. */
  private toLeafSummary(
    leaf: LeafDetectionResult
  ): UnifiedPlantAnalysisResponse['leafDetection'] {
    return {
      status: leaf.status,
      leafCount: leaf.leafCount,
      topConfidence: leaf.topConfidence,
      best: leaf.best,
      ...(leaf.latencyMs !== undefined ? { latencyMs: leaf.latencyMs } : {}),
      ...(leaf.message ? { message: leaf.message } : {}),
    };
  }

  /**
   * Orchestrates the complete plant analysis pipeline:
   * 0. YOLO11x Leaf Localization (advisory gate — skipped when unconfigured)
   * 1. Pl@ntNet Plant Identification
   * 2. Low Confidence Check
   * 3. Crop Normalization
   * 4. 14-Crop Gate Check (ConvNeXt is NEVER called if crop is unsupported)
   * 5. ConvNeXt Disease Detection (only for supported crops)
   *
   * @param imageBuffer Raw image file buffer
   * @param filename Optional filename
   * @param mimeType Optional MIME type
   */
  public async analyzePlantImage(
    imageBuffer: Buffer,
    filename: string = 'image.jpg',
    mimeType: string = 'image/jpeg'
  ): Promise<UnifiedPlantAnalysisResponse> {
    logger.info('Pipeline Step 0: Locating leaves via YOLO11x');

    // 0. Leaf Localization.
    //
    // Only a confident "there is no leaf here" stops the scan. `not_configured`
    // and `unavailable` both fall through to Pl@ntNet: the detector narrows the
    // funnel, and letting its outage block every scan would trade a cheap
    // optimisation for a hard dependency.
    const leaf = await leafDetectionService.detectLeaf(imageBuffer, mimeType);
    const leafDetection = this.toLeafSummary(leaf);

    if (leaf.status === 'no_leaf' && env.YOLO_GATE_ENABLED) {
      logger.info(
        'Pipeline Step 0: No leaf detected. Pipeline halted before Pl@ntNet is called.'
      );
      return {
        leafDetection,
        plant: null,
        crop: { supported: false },
        diseaseDetection: {
          available: false,
          disease: null,
        },
        message:
          'No leaf was found in this image. Move closer to a single leaf, ' +
          'hold steady and make sure it fills most of the frame.',
      };
    }

    logger.info('Pipeline Step 1: Initiating plant identification via Pl@ntNet');

    // 1. Identify Plant
    const plant = await plantIdentificationService.identifyPlant(
      imageBuffer,
      filename,
      mimeType
    );

    // 2. Low Confidence Check
    if (!plant.isConfident || !plant.name) {
      logger.info(
        `Pipeline Step 2: Plant identification confidence too low (${(
          plant.confidence * 100
        ).toFixed(1)}%). Pipeline halted.`
      );
      return {
        leafDetection,
        plant: null,
        crop: {
          supported: false,
        },
        diseaseDetection: {
          available: false,
          disease: null,
        },
        message: 'The plant could not be identified with sufficient confidence.',
      };
    }

    logger.info(
      `Pipeline Step 3: Normalizing plant "${plant.name}" (${plant.scientificName})`
    );

    // 3. Crop Normalization
    const cropResult = cropNormalizationService.normalizeCrop(
      plant.name,
      plant.scientificName
    );

    // 4. 14-Crop Supported Gate (STRICT BUSINESS RULE)
    if (!cropResult.supported || !cropResult.crop) {
      logger.info(
        `Pipeline Step 4: Crop "${cropResult.name}" is NOT in 14-crop supported list. STOPPING pipeline. ConvNeXt WILL NOT be called.`
      );
      return {
        leafDetection,
        plant: {
          name: cropResult.name,
          scientificName: plant.scientificName,
          confidence: Number(plant.confidence.toFixed(4)),
        },
        crop: {
          name: cropResult.name,
          supported: false,
        },
        diseaseDetection: {
          available: false,
          disease: null,
          message:
            'Disease detection is not available for this plant because LeafCare currently supports disease detection for 14 crop types.',
        },
      };
    }

    logger.info(
      `Pipeline Step 4: Crop "${cropResult.crop}" is SUPPORTED. Invoking ConvNeXt disease detection.`
    );

    // 5. ConvNeXt Disease Detection (Executed ONLY when crop.supported === true)
    const diseaseResult = await diseaseDetectionService.detectDisease(
      imageBuffer,
      cropResult.crop
    );

    logger.info('Pipeline Step 5: Complete. Returning unified response.');

    return {
      leafDetection,
      plant: {
        name: cropResult.name,
        scientificName: plant.scientificName,
        confidence: Number(plant.confidence.toFixed(4)),
      },
      crop: {
        name: cropResult.name,
        supported: true,
      },
      diseaseDetection: {
        available: diseaseResult.available,
        disease: diseaseResult.disease,
        ...(diseaseResult.message ? { message: diseaseResult.message } : {}),
      },
    };
  }
}

export const aiOrchestratorService = new AiOrchestratorService();
