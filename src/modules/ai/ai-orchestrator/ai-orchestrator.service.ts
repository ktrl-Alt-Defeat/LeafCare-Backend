import { cropNormalizationService } from '../crop-normalization/crop-normalization.service.js';
import { diseaseDetectionService } from '../disease-detection/disease-detection.service.js';
import { leafDetectionService } from '../leaf-detection/leaf-detection.service.js';
import { LeafDetectionResult } from '../leaf-detection/leaf-detection.types.js';
import { UnifiedPlantAnalysisResponse } from './ai-orchestrator.types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Copy shown to the farmer, kept together so the wording can be reviewed as a
 * whole rather than found scattered through the control flow.
 *
 * Each one says what happened and what to do next. "Unsupported" and
 * "uncertain" are deliberately different messages: the first is a limitation of
 * the product that no retake will fix, and telling someone to photograph their
 * rice again would waste their time.
 */
const MESSAGES = {
  unsupportedPlant:
    'This does not look like one of the crops LeafCare can diagnose. ' +
    'LeafCare currently covers 14 crops: apple, blueberry, cherry, corn, grape, ' +
    'orange, peach, bell pepper, potato, raspberry, soybean, squash, strawberry ' +
    'and tomato. Please photograph a leaf from one of these crops.',
  uncertain:
    'The photo was not clear enough to diagnose with confidence. ' +
    'Take another in daylight, with a single leaf filling most of the frame and ' +
    'the camera held steady.',
  unavailable:
    'The diagnosis service is temporarily unreachable. Your photo was not ' +
    'analysed — please try again in a moment.',
} as const;

export class AiOrchestratorService {
  /** Reshapes a Stage 0 result into the slice the response carries. */
  private toLeafSummary(
    leaf: LeafDetectionResult
  ): UnifiedPlantAnalysisResponse['leafDetection'] {
    return {
      status: leaf.status,
      leafCount: leaf.leafCount,
      topConfidence: leaf.topConfidence,
      best: leaf.best,
      cropped: leaf.crop !== null,
      ...(leaf.latencyMs !== undefined ? { latencyMs: leaf.latencyMs } : {}),
      ...(leaf.message ? { message: leaf.message } : {}),
    };
  }

  /**
   * Runs a captured frame through the scan pipeline.
   *
   * 0. Leaf localization (optional). A detected leaf is cropped out and
   *    everything downstream reads the crop. Nothing here can stop a scan: no
   *    leaf found, detector asleep, detector never configured — all three fall
   *    through to the classifier with the frame as submitted.
   * 1. Disease classification over the whole 38-class vocabulary, with the
   *    inference host's novelty verdict attached.
   * 2. Trust gate. An image unlike anything in the training set, or a
   *    classification too weak to act on, is reported as such and no disease is
   *    named. This is the check that stops a rice leaf being told it has tomato
   *    blight.
   * 3. Crop identification, read from the winning label. The classifier is the
   *    only thing that says which plant this is.
   * 4. The best disease for that crop, scored against that crop's classes.
   *
   * @param imageBuffer Raw image file buffer
   * @param filename Optional filename, unused downstream but kept for logging
   * @param mimeType Optional MIME type
   */
  public async analyzePlantImage(
    imageBuffer: Buffer,
    filename: string = 'image.jpg',
    mimeType: string = 'image/jpeg'
  ): Promise<UnifiedPlantAnalysisResponse> {
    logger.info(`Pipeline Step 0: Locating leaves in ${filename}`);

    // 0. Leaf localization — a helper, never a gate.
    const leaf = await leafDetectionService.detectLeaf(imageBuffer, mimeType, {
      returnCrop: true,
    });
    const leafDetection = this.toLeafSummary(leaf);

    const subject = leaf.crop?.buffer ?? imageBuffer;

    if (leaf.crop) {
      logger.info(
        `Pipeline Step 0: Classifying the ${leaf.crop.width}x${leaf.crop.height} leaf ROI ` +
          `(${(leaf.crop.buffer.length / 1024).toFixed(0)} KB).`
      );
    } else {
      logger.info(
        `Pipeline Step 0: No usable leaf crop (${leaf.status}). Classifying the full frame.`
      );
    }

    // 1. Classify.
    const classification = await diseaseDetectionService.classify({
      buffer: subject,
      ...(leaf.crop?.roiId ? { roiId: leaf.crop.roiId } : {}),
    });

    if (!classification.available || !classification.ranked || !classification.topLabel) {
      logger.warn('Pipeline Step 1: Classification unavailable.');
      return {
        leafDetection,
        verdict: 'unavailable',
        plant: null,
        crop: { supported: false },
        diseaseDetection: {
          available: false,
          disease: null,
          ...(classification.message ? { message: classification.message } : {}),
        },
        message: MESSAGES.unavailable,
      };
    }

    // 2. Trust gate.
    //
    // Deliberately ahead of naming the crop. A rejected image has no crop worth
    // reporting, and printing "Tomato" beside "we could not identify this
    // plant" would be the confusing half-answer this gate exists to prevent.
    const novelty = classification.novelty;

    if (novelty && !novelty.accepted) {
      const unsupported = novelty.verdict === 'reject_unsupported';

      logger.info(
        `Pipeline Step 2: Rejected as ${novelty.verdict} ` +
          `(kNN ${novelty.knnDistance.toFixed(3)}, energy ${novelty.energy.toFixed(2)}, ` +
          `confidence ${(novelty.confidence * 100).toFixed(1)}%). ` +
          `The closest class would have been "${classification.topLabel}".`
      );

      return {
        leafDetection,
        verdict: unsupported ? 'unsupported_plant' : 'uncertain',
        plant: null,
        crop: { supported: false },
        diseaseDetection: {
          available: false,
          disease: null,
          ...(novelty.reason ? { message: novelty.reason } : {}),
        },
        novelty,
        message: unsupported ? MESSAGES.unsupportedPlant : MESSAGES.uncertain,
      };
    }

    if (!novelty) {
      // The host answered without a verdict, which means its novelty check is
      // off or uncalibrated. Recorded rather than silently trusted: this is a
      // diagnosis with nothing vouching for the image behind it.
      logger.warn(
        'Pipeline Step 2: The inference host returned no novelty verdict. ' +
          'Reporting the classification unchecked.'
      );
    }

    // 3. Which crop is this? The winning label is the only thing that says so.
    const cropResult = cropNormalizationService.normalizeFromLabel(classification.topLabel);

    if (!cropResult.supported || !cropResult.crop) {
      // Every one of the 38 classes belongs to a supported crop, so reaching
      // here means the served vocabulary and this backend's crop list have
      // drifted apart. Reported honestly rather than guessed at.
      logger.error(
        `Pipeline Step 3: Label "${classification.topLabel}" maps to no supported crop. ` +
          `The served model and the supported-crop list disagree.`
      );
      return {
        leafDetection,
        verdict: 'unsupported_plant',
        plant: null,
        crop: { supported: false },
        diseaseDetection: { available: false, disease: null },
        ...(novelty ? { novelty } : {}),
        message: MESSAGES.unsupportedPlant,
      };
    }

    // 4. The best disease for that crop.
    const selected = diseaseDetectionService.selectForCrop(
      classification.ranked,
      cropResult.crop
    );

    if (!selected) {
      logger.warn(
        `Pipeline Step 4: The ranking held no class for ${cropResult.crop}, ` +
          `despite the top label being "${classification.topLabel}".`
      );
      return {
        leafDetection,
        verdict: 'uncertain',
        plant: null,
        crop: { supported: false },
        diseaseDetection: { available: false, disease: null },
        ...(novelty ? { novelty } : {}),
        message: MESSAGES.uncertain,
      };
    }

    const diseaseName = diseaseDetectionService.cleanDiseaseLabel(
      selected.label,
      cropResult.crop
    );

    // Crop-level confidence: how much of the model's belief sits on this crop at
    // all, as opposed to how sure it is of the disease within it. The two answer
    // different questions and the response reports both.
    const cropConfidence = classification.ranked
      .filter(
        (entry) => cropNormalizationService.cropFromLabel(entry.label) === cropResult.crop
      )
      .reduce((sum, entry) => sum + entry.confidence, 0);

    logger.info(
      `Pipeline complete: ${cropResult.name} (${(cropConfidence * 100).toFixed(1)}%) ` +
        `-> ${diseaseName} (${(selected.confidence * 100).toFixed(1)}%)`
    );

    return {
      leafDetection,
      verdict: 'diagnosed',
      plant: {
        name: cropResult.name,
        scientificName: cropResult.scientificName,
        confidence: Number(cropConfidence.toFixed(4)),
      },
      crop: {
        name: cropResult.name,
        id: cropResult.crop,
        supported: true,
      },
      diseaseDetection: {
        available: true,
        disease: {
          name: diseaseName,
          confidence: Number(selected.confidence.toFixed(4)),
        },
      },
      ...(novelty ? { novelty } : {}),
    };
  }
}

export const aiOrchestratorService = new AiOrchestratorService();
