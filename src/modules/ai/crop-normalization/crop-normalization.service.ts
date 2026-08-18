import {
  SUPPORTED_CROPS,
  SUPPORTED_CROP_DEFINITIONS,
  SupportedCrop,
} from './supported-crops.js';
import { CropNormalizationResult } from './crop-normalization.types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Crop segments whose letters neither contain nor are contained by the
 * canonical crop name. Only entries that plain letter comparison gets wrong
 * belong here: "corn_(maize)" and "cherry_(including_sour)" both resolve on
 * their own, but "pepper,_bell" and "bell_pepper" share no containment.
 */
const CROP_SEGMENT_ALIASES: Record<string, SupportedCrop> = {
  pepperbell: 'BELL_PEPPER',
  bellpepper: 'BELL_PEPPER',
  pepper: 'BELL_PEPPER',
};

/**
 * Maps what the models say onto the 14 crop categories LeafCare supports.
 *
 * There are two ways in. `normalizeFromLabel` reads the crop out of a
 * PlantVillage class label — this is the one the scan pipeline uses, because
 * the classifier's own label is now the only statement anyone makes about which
 * plant this is. `normalizeCrop` matches a free-text plant name against the
 * botanical vocabulary, and remains for callers that have a name from somewhere
 * else.
 *
 * Both fail closed. An unrecognised plant is `supported: false`, never a guess.
 */
export class CropNormalizationService {
  /**
   * Reads the crop half of a class label such as `tomato___early_blight`.
   *
   * The dataset's crop segments are not clean identifiers — they carry
   * qualifiers and punctuation ("Corn_(maize)", "Pepper,_bell",
   * "cherry_including_sour") — so this compares on letters only, and is
   * case-insensitive because model deployments disagree on casing.
   */
  public cropFromLabel(rawLabel: string): SupportedCrop | null {
    if (!rawLabel) return null;

    const segment = rawLabel.includes('___') ? rawLabel.split('___')[0] ?? '' : rawLabel;
    const letters = segment.toLowerCase().replace(/[^a-z]/g, '');
    if (!letters) return null;

    const alias = CROP_SEGMENT_ALIASES[letters];
    if (alias) return alias;

    for (const candidate of SUPPORTED_CROPS) {
      const canonical = candidate.toLowerCase().replace(/[^a-z]/g, '');
      // "cornmaize" vs "corn": accept either direction of containment rather
      // than demanding an exact match.
      if (letters.includes(canonical) || canonical.includes(letters)) return candidate;
    }

    return null;
  }

  /**
   * Normalizes a model class label into the crop the scan reports.
   *
   * The scientific name comes from our own botanical vocabulary rather than
   * from the model, which only knows crop names — so it is the species the crop
   * category stands for, not an identification of this particular specimen.
   */
  public normalizeFromLabel(rawLabel: string): CropNormalizationResult {
    const crop = this.cropFromLabel(rawLabel);

    if (!crop) {
      logger.info(`Crop normalization: label "${rawLabel}" maps to no supported crop.`);
      return { supported: false, crop: null, name: 'Unknown Plant', scientificName: null };
    }

    const definition = SUPPORTED_CROP_DEFINITIONS[crop];
    return {
      supported: true,
      crop,
      name: definition.displayName,
      scientificName: definition.scientificNames[0] ?? null,
    };
  }

  /**
   * Normalizes a free-text plant name against the 14 supported crop categories.
   *
   * Five stages, and no blind genus matching:
   * 1. Exact scientific species match
   * 2. Approved scientific aliases
   * 3. Approved common-name aliases
   * 4. Verified species mappings
   * 5. Otherwise UNSUPPORTED
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
