import assert from 'node:assert/strict';
import { test, describe, beforeEach, afterEach } from 'node:test';
import { AiOrchestratorService } from '../../src/modules/ai/ai-orchestrator/ai-orchestrator.service.js';
import { plantIdentificationService } from '../../src/modules/ai/plant-identification/plant-identification.service.js';
import { diseaseDetectionService } from '../../src/modules/ai/disease-detection/disease-detection.service.js';

describe('AI Orchestrator Pipeline — End-to-End Business Logic & Gate Tests', () => {
  let convNextCallCount = 0;
  let lastConvNextCrop: string | null = null;

  const originalIdentify = plantIdentificationService.identifyPlant;
  const originalDetect = diseaseDetectionService.detectDisease;

  beforeEach(() => {
    convNextCallCount = 0;
    lastConvNextCrop = null;
  });

  afterEach(() => {
    plantIdentificationService.identifyPlant = originalIdentify;
    diseaseDetectionService.detectDisease = originalDetect;
  });

  test('Test 1 & 2: Supported Crop (Tomato & Soybean) runs ConvNeXt disease detection', async () => {
    plantIdentificationService.identifyPlant = async () => ({
      isConfident: true,
      name: 'Tomato',
      scientificName: 'Solanum lycopersicum',
      confidence: 0.92,
    });

    diseaseDetectionService.detectDisease = async (_buf, crop) => {
      convNextCallCount++;
      lastConvNextCrop = crop;
      return {
        available: true,
        disease: {
          name: 'Early Blight',
          confidence: 0.94,
        },
      };
    };

    const orchestrator = new AiOrchestratorService();
    const result = await orchestrator.analyzePlantImage(Buffer.from('dummy image content'));

    assert.equal(result.crop.supported, true, 'Tomato crop must be supported');
    assert.equal(result.crop.name, 'Tomato');
    assert.equal(result.diseaseDetection.available, true);
    assert.equal(result.diseaseDetection.disease?.name, 'Early Blight');
    assert.equal(result.diseaseDetection.disease?.confidence, 0.94);
    assert.equal(convNextCallCount, 1, 'ConvNeXt MUST be invoked exactly once for supported crops');
    assert.equal(lastConvNextCrop, 'TOMATO');
  });

  test('Test 3: Unsupported Crop (Mango) — MANDATORY GATE TEST: ConvNeXt MUST NOT be called', async () => {
    plantIdentificationService.identifyPlant = async () => ({
      isConfident: true,
      name: 'Mango',
      scientificName: 'Mangifera indica',
      confidence: 0.91,
    });

    diseaseDetectionService.detectDisease = async () => {
      convNextCallCount++;
      return { available: true, disease: { name: 'Fake Disease', confidence: 0.99 } };
    };

    const orchestrator = new AiOrchestratorService();
    const result = await orchestrator.analyzePlantImage(Buffer.from('dummy image content'));

    assert.equal(result.crop.supported, false, 'Mango MUST be unsupported');
    assert.equal(result.plant?.name, 'Mango');
    assert.equal(result.diseaseDetection.available, false);
    assert.equal(result.diseaseDetection.disease, null);
    assert.ok(
      result.diseaseDetection.message?.includes('Disease detection is not available'),
      'Clear disease-unavailable message must be returned'
    );
    assert.equal(
      convNextCallCount,
      0,
      'CRITICAL REQUIREMENT: ConvNeXt call count MUST BE EXACTLY 0 for unsupported crops'
    );
  });

  test('Test 4: Rose — Unsupported plant gate test: ConvNeXt MUST NOT be called', async () => {
    plantIdentificationService.identifyPlant = async () => ({
      isConfident: true,
      name: 'Rose',
      scientificName: 'Rosa rubiginosa',
      confidence: 0.88,
    });

    diseaseDetectionService.detectDisease = async () => {
      convNextCallCount++;
      return { available: true, disease: { name: 'Fake', confidence: 0.5 } };
    };

    const orchestrator = new AiOrchestratorService();
    const result = await orchestrator.analyzePlantImage(Buffer.from('dummy image content'));

    assert.equal(result.crop.supported, false);
    assert.equal(result.diseaseDetection.available, false);
    assert.equal(convNextCallCount, 0, 'ConvNeXt MUST NOT be called for Rose');
  });

  test('Test 5: Low-Confidence Pl@ntNet response stops pipeline', async () => {
    plantIdentificationService.identifyPlant = async () => ({
      isConfident: false,
      name: 'Tomato',
      scientificName: 'Solanum lycopersicum',
      confidence: 0.25,
    });

    diseaseDetectionService.detectDisease = async () => {
      convNextCallCount++;
      return { available: true, disease: { name: 'Fake', confidence: 0.5 } };
    };

    const orchestrator = new AiOrchestratorService();
    const result = await orchestrator.analyzePlantImage(Buffer.from('dummy image content'));

    assert.equal(result.plant, null, 'Low confidence identification must set plant = null');
    assert.equal(result.crop.supported, false);
    assert.equal(result.diseaseDetection.available, false);
    assert.equal(convNextCallCount, 0, 'ConvNeXt MUST NOT be called for low-confidence identification');
  });

  test('Test 6: Pl@ntNet API failure stops pipeline and does not call ConvNeXt', async () => {
    plantIdentificationService.identifyPlant = async () => {
      throw new Error('Pl@ntNet 500 Internal Server Error');
    };

    diseaseDetectionService.detectDisease = async () => {
      convNextCallCount++;
      return { available: true, disease: { name: 'Fake', confidence: 0.5 } };
    };

    const orchestrator = new AiOrchestratorService();
    await assert.rejects(
      async () => await orchestrator.analyzePlantImage(Buffer.from('dummy image content')),
      /Pl@ntNet 500/
    );

    assert.equal(convNextCallCount, 0, 'ConvNeXt MUST NOT be called when Pl@ntNet fails');
  });

  test('Test 7: ConvNeXt service failure for supported crop returns controlled error', async () => {
    plantIdentificationService.identifyPlant = async () => ({
      isConfident: true,
      name: 'Potato',
      scientificName: 'Solanum tuberosum',
      confidence: 0.95,
    });

    diseaseDetectionService.detectDisease = async () => {
      convNextCallCount++;
      return {
        available: false,
        disease: null,
        message: 'Disease detection service is currently unreachable.',
      };
    };

    const orchestrator = new AiOrchestratorService();
    const result = await orchestrator.analyzePlantImage(Buffer.from('dummy image content'));

    assert.equal(result.crop.supported, true);
    assert.equal(result.crop.name, 'Potato');
    assert.equal(result.diseaseDetection.available, false);
    assert.equal(result.diseaseDetection.disease, null, 'Do NOT fabricate disease output when model fails');
    assert.equal(convNextCallCount, 1);
  });
});
