import { plantIdentificationService } from '../plant-identification/plant-identification.service.js';
import { cropNormalizationService } from '../crop-normalization/crop-normalization.service.js';
import { diseaseDetectionService } from '../disease-detection/disease-detection.service.js';
import { UnifiedPlantAnalysisResponse } from './ai-orchestrator.types.js';
import { logger } from '../../../utils/logger.js';

export class AiOrchestratorService {
  /**
   * Orchestrates the complete plant analysis pipeline:
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
