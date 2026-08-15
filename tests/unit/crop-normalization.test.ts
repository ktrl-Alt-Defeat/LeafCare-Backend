import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { cropNormalizationService } from '../../src/modules/ai/crop-normalization/crop-normalization.service.js';
import { SUPPORTED_CROPS } from '../../src/modules/ai/crop-normalization/supported-crops.js';

describe('Crop Normalization Service — 14 Supported Crops Gate', () => {
  test('All 14 supported crops resolve to supported = true', () => {
    const supportedTestCases = [
      { name: 'Tomato', sci: 'Solanum lycopersicum', expected: 'TOMATO' },
      { name: 'Soybean', sci: 'Glycine max', expected: 'SOYBEAN' },
      { name: 'Orange', sci: 'Citrus sinensis', expected: 'ORANGE' },
      { name: 'Peach', sci: 'Prunus persica', expected: 'PEACH' },
      { name: 'Squash', sci: 'Cucurbita pepo', expected: 'SQUASH' },
      { name: 'Apple', sci: 'Malus domestica', expected: 'APPLE' },
      { name: 'Blueberry', sci: 'Vaccinium corymbosum', expected: 'BLUEBERRY' },
      { name: 'Bell Pepper', sci: 'Capsicum annuum', expected: 'BELL_PEPPER' },
      { name: 'Grape', sci: 'Vitis vinifera', expected: 'GRAPE' },
      { name: 'Corn', sci: 'Zea mays', expected: 'CORN' },
      { name: 'Strawberry', sci: 'Fragaria × ananassa', expected: 'STRAWBERRY' },
      { name: 'Potato', sci: 'Solanum tuberosum', expected: 'POTATO' },
      { name: 'Cherry', sci: 'Prunus avium', expected: 'CHERRY' },
      { name: 'Raspberry', sci: 'Rubus idaeus', expected: 'RASPBERRY' },
    ];

    assert.equal(SUPPORTED_CROPS.length, 14, 'Authoritative supported crops array must contain exactly 14 items');

    for (const item of supportedTestCases) {
      const result = cropNormalizationService.normalizeCrop(item.name, item.sci);
      assert.equal(
        result.supported,
        true,
        `Crop "${item.name}" (${item.sci}) should be supported`
      );
      assert.equal(
        result.crop,
        item.expected,
        `Crop "${item.name}" should normalize to ${item.expected}`
      );
    }
  });

  test('Unsupported plants resolve to supported = false', () => {
    const unsupportedCases = [
      { name: 'Mango', sci: 'Mangifera indica' },
      { name: 'Rose', sci: 'Rosa rubiginosa' },
      { name: 'Banana', sci: 'Musa acuminata' },
      { name: 'Rice', sci: 'Oryza sativa' },
      { name: 'Wheat', sci: 'Triticum aestivum' },
      { name: 'Cotton', sci: 'Gossypium hirsutum' },
      { name: 'Cucumber', sci: 'Cucumis sativus' },
      { name: 'Carrot', sci: 'Daucus carota' },
      { name: 'Chili', sci: 'Capsicum frutescens' },
      { name: 'Eggplant', sci: 'Solanum melongena' },
    ];

    for (const item of unsupportedCases) {
      const result = cropNormalizationService.normalizeCrop(item.name, item.sci);
      assert.equal(
        result.supported,
        false,
        `Plant "${item.name}" (${item.sci}) MUST be unsupported`
      );
      assert.equal(
        result.crop,
        null,
        `Plant "${item.name}" must have crop = null`
      );
    }
  });
});
