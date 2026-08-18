import assert from 'node:assert/strict';
import { test, describe, afterEach } from 'node:test';
import { AiOrchestratorService } from '../../src/modules/ai/ai-orchestrator/ai-orchestrator.service.js';
import { diseaseDetectionService } from '../../src/modules/ai/disease-detection/disease-detection.service.js';
import { leafDetectionService } from '../../src/modules/ai/leaf-detection/leaf-detection.service.js';
import type { DiseaseDetectionResult } from '../../src/modules/ai/disease-detection/disease-detection.interface.js';
import type { LeafDetectionResult } from '../../src/modules/ai/leaf-detection/leaf-detection.types.js';

/**
 * The rules the scan pipeline exists to enforce.
 *
 * Two of them matter more than the rest and are the reason this file is
 * separate from the unit tests: leaf detection must never be able to refuse a
 * scan, and an image the classifier does not recognise must never come back
 * with a disease name.
 */
describe('Scan pipeline', () => {
  const orchestrator = new AiOrchestratorService();
  const frame = Buffer.from('fake-image-bytes');

  const originalDetect = leafDetectionService.detectLeaf;
  const originalClassify = diseaseDetectionService.classify;

  afterEach(() => {
    leafDetectionService.detectLeaf = originalDetect;
    diseaseDetectionService.classify = originalClassify;
  });

  /** A detector answer, defaulting to "found nothing". */
  const detection = (over: Partial<LeafDetectionResult> = {}): LeafDetectionResult => ({
    status: 'no_leaf',
    leafCount: 0,
    topConfidence: null,
    best: null,
    crop: null,
    ...over,
  });

  /** A classifier answer over a small stand-in vocabulary. */
  const classification = (over: Partial<DiseaseDetectionResult> = {}): DiseaseDetectionResult => ({
    available: true,
    disease: null,
    topLabel: 'tomato___early_blight',
    ranked: [
      { label: 'tomato___early_blight', confidence: 0.8 },
      { label: 'tomato___late_blight', confidence: 0.1 },
      { label: 'potato___early_blight', confidence: 0.1 },
    ],
    novelty: {
      verdict: 'accept',
      accepted: true,
      knnDistance: 0.09,
      energy: -20.1,
      confidence: 0.8,
    },
    ...over,
  });

  test('a supported crop is diagnosed, with the crop read from the winning label', async () => {
    leafDetectionService.detectLeaf = async () => detection();
    diseaseDetectionService.classify = async () => classification();

    const result = await orchestrator.analyzePlantImage(frame);

    assert.equal(result.verdict, 'diagnosed');
    assert.equal(result.crop.id, 'TOMATO');
    assert.equal(result.crop.supported, true);
    assert.equal(result.plant?.name, 'Tomato');
    assert.equal(result.diseaseDetection.disease?.name, 'Early Blight');
  });

  test('disease confidence is conditioned on the crop, not spread over every class', async () => {
    leafDetectionService.detectLeaf = async () => detection();
    diseaseDetectionService.classify = async () => classification();

    const result = await orchestrator.analyzePlantImage(frame);

    // 0.8 of 0.9 tomato mass. Reporting the raw 0.8 would understate a call the
    // model is, given the crop, 89% sure of.
    assert.ok(result.diseaseDetection.disease);
    assert.equal(Number(result.diseaseDetection.disease.confidence.toFixed(4)), 0.8889);
    // Crop-level confidence answers the other question: how much belief sits on
    // tomato at all.
    assert.equal(Number(result.plant?.confidence.toFixed(4)), 0.9);
  });

  test('an unrecognised plant is refused a diagnosis', async () => {
    leafDetectionService.detectLeaf = async () => detection();
    diseaseDetectionService.classify = async () =>
      classification({
        novelty: {
          verdict: 'reject_unsupported',
          accepted: false,
          knnDistance: 0.51,
          energy: -6.2,
          confidence: 0.71,
          reason: 'Far from every training example.',
        },
      });

    const result = await orchestrator.analyzePlantImage(frame);

    assert.equal(result.verdict, 'unsupported_plant');
    assert.equal(result.diseaseDetection.available, false);
    assert.equal(result.diseaseDetection.disease, null);
    assert.equal(result.crop.supported, false);
    // No crop is named either: "Tomato" beside "we do not recognise this plant"
    // is the contradiction the gate exists to avoid.
    assert.equal(result.plant, null);
    assert.match(result.message ?? '', /14 crops/);
  });

  test('a confident-looking but undecided classification is reported as uncertain', async () => {
    leafDetectionService.detectLeaf = async () => detection();
    diseaseDetectionService.classify = async () =>
      classification({
        novelty: {
          verdict: 'reject_uncertain',
          accepted: false,
          knnDistance: 0.12,
          energy: -18.0,
          confidence: 0.31,
          reason: 'Best match scored 31%.',
        },
      });

    const result = await orchestrator.analyzePlantImage(frame);

    assert.equal(result.verdict, 'uncertain');
    assert.equal(result.diseaseDetection.disease, null);
    // Different advice from the unsupported case: this one is worth retaking.
    assert.match(result.message ?? '', /another/i);
  });

  test('leaf detection finding nothing does not stop the scan', async () => {
    let classified = false;
    leafDetectionService.detectLeaf = async () => detection({ status: 'no_leaf' });
    diseaseDetectionService.classify = async () => {
      classified = true;
      return classification();
    };

    const result = await orchestrator.analyzePlantImage(frame);

    assert.equal(classified, true, 'the classifier must still run');
    assert.equal(result.verdict, 'diagnosed');
    assert.equal(result.leafDetection.cropped, false);
  });

  test('leaf detection being unreachable does not stop the scan', async () => {
    leafDetectionService.detectLeaf = async () =>
      detection({ status: 'unavailable', message: 'Host asleep.' });
    diseaseDetectionService.classify = async () => classification();

    const result = await orchestrator.analyzePlantImage(frame);

    assert.equal(result.verdict, 'diagnosed');
    assert.equal(result.leafDetection.status, 'unavailable');
  });

  test('a detected leaf is classified as a crop, by handle when one is offered', async () => {
    let sawRoiId: string | undefined;
    leafDetectionService.detectLeaf = async () =>
      detection({
        status: 'detected',
        leafCount: 1,
        topConfidence: 0.91,
        best: { confidence: 0.91, boxPixel: [0, 0, 100, 100], boxNorm: [0, 0, 1, 1] },
        crop: {
          buffer: Buffer.from('cropped'),
          mimeType: 'image/jpeg',
          roiId: 'roi-123',
          width: 100,
          height: 100,
        },
      });
    diseaseDetectionService.classify = async (input) => {
      sawRoiId = Buffer.isBuffer(input) ? undefined : input.roiId;
      return classification();
    };

    const result = await orchestrator.analyzePlantImage(frame);

    assert.equal(sawRoiId, 'roi-123');
    assert.equal(result.leafDetection.cropped, true);
  });

  test('an unreachable classifier is reported as unavailable, not as a healthy leaf', async () => {
    leafDetectionService.detectLeaf = async () => detection();
    diseaseDetectionService.classify = async () => ({
      available: false,
      disease: null,
      message: 'Inference host is unreachable.',
    });

    const result = await orchestrator.analyzePlantImage(frame);

    assert.equal(result.verdict, 'unavailable');
    assert.equal(result.diseaseDetection.available, false);
    assert.match(result.message ?? '', /try again/i);
  });

  test('a healthy leaf is diagnosed, not rejected', async () => {
    leafDetectionService.detectLeaf = async () => detection();
    diseaseDetectionService.classify = async () =>
      classification({
        topLabel: 'tomato___healthy',
        ranked: [
          { label: 'tomato___healthy', confidence: 0.97 },
          { label: 'tomato___early_blight', confidence: 0.03 },
        ],
      });

    const result = await orchestrator.analyzePlantImage(frame);

    assert.equal(result.verdict, 'diagnosed');
    assert.equal(result.diseaseDetection.disease?.name, 'Healthy');
  });
});
