import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { diseaseDetectionService } from '../../src/modules/ai/disease-detection/disease-detection.service.js';
import { cropNormalizationService } from '../../src/modules/ai/crop-normalization/crop-normalization.service.js';

describe('Reading the crop out of a class label', () => {
  test('plain labels resolve', () => {
    assert.equal(cropNormalizationService.cropFromLabel('tomato___early_blight'), 'TOMATO');
    assert.equal(cropNormalizationService.cropFromLabel('grape___black_rot'), 'GRAPE');
  });

  test('qualified crop segments resolve', () => {
    assert.equal(cropNormalizationService.cropFromLabel('corn_maize___common_rust'), 'CORN');
    assert.equal(
      cropNormalizationService.cropFromLabel('cherry_including_sour___powdery_mildew'),
      'CHERRY'
    );
  });

  test('bell pepper resolves despite sharing no containment with its label', () => {
    // "pepperbell" neither contains nor is contained by "bellpepper", so letter
    // comparison alone reads every bell pepper class as belonging to no crop.
    assert.equal(
      cropNormalizationService.cropFromLabel('pepper_bell___bacterial_spot'),
      'BELL_PEPPER'
    );
  });

  test('an unknown crop resolves to nothing rather than to a guess', () => {
    assert.equal(cropNormalizationService.cropFromLabel('rice___leaf_blast'), null);
    assert.equal(cropNormalizationService.cropFromLabel(''), null);
  });

  test('normalizeFromLabel names the crop and its species', () => {
    const result = cropNormalizationService.normalizeFromLabel('pepper_bell___healthy');
    assert.equal(result.supported, true);
    assert.equal(result.crop, 'BELL_PEPPER');
    assert.equal(result.name, 'Bell Pepper');
    assert.equal(result.scientificName, 'capsicum annuum');
  });

  test('normalizeFromLabel fails closed on an unsupported crop', () => {
    const result = cropNormalizationService.normalizeFromLabel('wheat___rust');
    assert.equal(result.supported, false);
    assert.equal(result.crop, null);
  });
});

describe('Choosing the disease within a crop', () => {
  const ranked = [
    { label: 'potato___early_blight', confidence: 0.02 },
    { label: 'tomato___early_blight', confidence: 0.9 },
    { label: 'potato___late_blight', confidence: 0.06 },
    { label: 'tomato___late_blight', confidence: 0.02 },
  ];

  test('picks the best class belonging to the crop, not the global best', () => {
    const selected = diseaseDetectionService.selectForCrop(ranked, 'POTATO');
    assert.equal(selected?.label, 'potato___late_blight');
  });

  test('confidence is renormalised over that crop', () => {
    const selected = diseaseDetectionService.selectForCrop(ranked, 'POTATO');
    // 0.06 of the 0.08 sitting on potato. Reported raw, the right answer would
    // read as 6% purely because most belief sat on the same disease elsewhere.
    assert.equal(Number(selected?.confidence.toFixed(4)), 0.75);
  });

  test('returns nothing when the ranking holds no class for the crop', () => {
    assert.equal(diseaseDetectionService.selectForCrop(ranked, 'SQUASH'), null);
  });
});
