import fs from 'fs';
import path from 'path';
import { diseaseDetectionService } from '../src/modules/ai/disease-detection/disease-detection.service.js';

async function runMultiCropInferenceTest() {
  const imagePath = path.resolve(process.cwd(), 'scratch/sample_leaf.jpg');
  const imageBuffer = fs.readFileSync(imagePath);

  const testCrops = ['TOMATO', 'POTATO', 'SOYBEAN', 'ORANGE', 'APPLE', 'GRAPE', 'CORN'] as const;

  console.log('Testing live multi-crop ConvNeXt HTTP Inference:');
  for (const crop of testCrops) {
    const started = Date.now();
    const result = await diseaseDetectionService.detectDisease(imageBuffer, crop);
    const duration = Date.now() - started;
    console.log(`- Crop: ${crop.padEnd(10)} | Disease: ${result.disease?.name.padEnd(25)} | Confidence: ${result.disease?.confidence} | Time: ${duration}ms`);
  }
}

runMultiCropInferenceTest();
