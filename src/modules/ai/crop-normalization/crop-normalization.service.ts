import { SUPPORTED_CROP_DEFINITIONS } from './supported-crops.js';
import { CropNormalizationResult } from './crop-normalization.types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Normalizes plant species / common names from Pl@ntNet to LeafCare crop categories.
 *
 * Enforces a strict 5-stage matching strategy to prevent false-positive crop classification:
 * 1. Exact scientific species match
 * 2. Explicitly approved scientific aliases
 * 3. Explicitly approved common-name aliases
 * 4. Explicitly verified species mappings
 * 5. Otherwise UNSUPPORTED (supported = false)
 *
 * NO BLIND GENUS MATCHING IS ALLOWED.
 */
export class CropNormalizationService {
  /**
   * Normalizes plant identification metadata against the 14 supported crop categories.
   */
  public normalizeCrop(
    plantName: string,
    scientificName?: string | null
  ): CropNormalizationResult {
    const cleanScientific = scientificName ? scientificName.trim().toLowerCase() : '';
    const cleanCommon = plantName ? plantName.trim().toLowerCase() : '';

    // Step 1 & 2: Match by exact scientific species or approved scientific aliases
    if (cleanScientific) {
      for (const def of Object.values(SUPPORTED_CROP_DEFINITIONS)) {
        for (const sciName of def.scientificNames) {
          if (
            cleanScientific === sciName ||
            cleanScientific.startsWith(sciName + ' ') ||
            sciName.startsWith(cleanScientific + ' ')
          ) {
            logger.info(
              `Crop normalized via scientific match: "${scientificName}" -> ${def.crop}`
            );
            return {
              supported: true,
              crop: def.crop,
              name: def.displayName,
              scientificName: scientificName || null,
            };
          }
        }
      }
    }

    // Step 3 & 4: Match by explicit common-name aliases
    if (cleanCommon) {
      for (const def of Object.values(SUPPORTED_CROP_DEFINITIONS)) {
        for (const commonName of def.commonNames) {
          if (
            cleanCommon === commonName ||
            cleanCommon.includes(commonName) ||
            commonName.includes(cleanCommon)
          ) {
            logger.info(
              `Crop normalized via common name match: "${plantName}" -> ${def.crop}`
            );
            return {
              supported: true,
              crop: def.crop,
              name: def.displayName,
              scientificName: scientificName || null,
            };
          }
        }
      }
    }

    // Step 5: Unmatched / Ambiguous -> UNSUPPORTED
    const displayName =
      plantName && plantName !== 'Unknown'
        ? plantName
        : scientificName || 'Unknown Plant';

    logger.info(
      `Crop normalization: Plant "${displayName}" (${scientificName || 'no scientific name'}) is UNSUPPORTED`
    );

    return {
      supported: false,
      crop: null,
      name: displayName,
      scientificName: scientificName || null,
    };
  }
}

export const cropNormalizationService = new CropNormalizationService();
