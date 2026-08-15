import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { diseaseDetectionService } from '../../src/modules/ai/disease-detection/disease-detection.service.js';

describe('Disease Detection Service — Label Cleaning & Parsing', () => {
  test('Cleans PlantVillage style raw class labels (Tomato___Early_blight -> Early Blight)', () => {
    const raw = 'Tomato___Early_blight';
    const cleaned = diseaseDetectionService.cleanDiseaseLabel(raw, 'TOMATO');
    assert.equal(cleaned, 'Early Blight');
  });

  test('Cleans underscore labels (Late_blight -> Late Blight)', () => {
    const raw = 'Late_blight';
    const cleaned = diseaseDetectionService.cleanDiseaseLabel(raw, 'POTATO');
    assert.equal(cleaned, 'Late Blight');
  });

  test('Cleans crop-prefixed labels (Tomato Early Blight -> Early Blight)', () => {
    const raw = 'Tomato Early Blight';
    const cleaned = diseaseDetectionService.cleanDiseaseLabel(raw, 'TOMATO');
    assert.equal(cleaned, 'Early Blight');
  });

  test('Preserves healthy labels (Tomato___healthy -> Healthy)', () => {
    const raw = 'Tomato___healthy';
    const cleaned = diseaseDetectionService.cleanDiseaseLabel(raw, 'TOMATO');
    assert.equal(cleaned, 'Healthy');
  });
});
