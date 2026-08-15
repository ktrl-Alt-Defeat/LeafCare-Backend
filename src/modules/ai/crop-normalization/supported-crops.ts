/**
 * Authoritative list of the 14 supported crop categories for LeafCare disease detection.
 * LeafCare disease model is strictly trained ONLY for these 14 crop categories.
 */
export const SUPPORTED_CROPS = [
  'TOMATO',
  'SOYBEAN',
  'ORANGE',
  'PEACH',
  'SQUASH',
  'APPLE',
  'BLUEBERRY',
  'BELL_PEPPER',
  'GRAPE',
  'CORN',
  'STRAWBERRY',
  'POTATO',
  'CHERRY',
  'RASPBERRY',
] as const;

export type SupportedCrop = (typeof SUPPORTED_CROPS)[number];

export interface CropBotanicalDefinition {
  crop: SupportedCrop;
  displayName: string;
  scientificNames: string[];
  commonNames: string[];
}

export const SUPPORTED_CROP_DEFINITIONS: Record<SupportedCrop, CropBotanicalDefinition> = {
  TOMATO: {
    crop: 'TOMATO',
    displayName: 'Tomato',
    scientificNames: ['solanum lycopersicum', 'lycopersicon esculentum'],
    commonNames: ['tomato', 'tomatoes'],
  },
  SOYBEAN: {
    crop: 'SOYBEAN',
    displayName: 'Soybean',
    scientificNames: ['glycine max'],
    commonNames: ['soybean', 'soybeans', 'soy bean', 'soya bean'],
  },
  ORANGE: {
    crop: 'ORANGE',
    displayName: 'Orange',
    scientificNames: ['citrus sinensis', 'citrus x sinensis'],
    commonNames: ['orange', 'sweet orange', 'oranges'],
  },
  PEACH: {
    crop: 'PEACH',
    displayName: 'Peach',
    scientificNames: ['prunus persica'],
    commonNames: ['peach', 'peaches', 'nectarine'],
  },
  SQUASH: {
    crop: 'SQUASH',
    displayName: 'Squash',
    scientificNames: [
      'cucurbita pepo',
      'cucurbita maxima',
      'cucurbita moschata',
      'cucurbita ficifolia',
    ],
    commonNames: ['squash', 'zucchini', 'pumpkin', 'courgette', 'summer squash', 'winter squash'],
  },
  APPLE: {
    crop: 'APPLE',
    displayName: 'Apple',
    scientificNames: ['malus domestica', 'malus pumila', 'malus sylvestris'],
    commonNames: ['apple', 'apples'],
  },
  BLUEBERRY: {
    crop: 'BLUEBERRY',
    displayName: 'Blueberry',
    scientificNames: [
      'vaccinium corymbosum',
      'vaccinium angustifolium',
      'vaccinium myrtillus',
      'vaccinium virgatum',
      'vaccinium ashei',
    ],
    commonNames: ['blueberry', 'blueberries', 'highbush blueberry', 'lowbush blueberry'],
  },
  BELL_PEPPER: {
    crop: 'BELL_PEPPER',
    displayName: 'Bell Pepper',
    scientificNames: ['capsicum annuum'],
    commonNames: [
      'bell pepper',
      'sweet pepper',
      'paprika',
      'capsicum',
      'green pepper',
      'red pepper',
      'yellow pepper',
    ],
  },
  GRAPE: {
    crop: 'GRAPE',
    displayName: 'Grape',
    scientificNames: ['vitis vinifera', 'vitis labrusca', 'vitis rotundifolia'],
    commonNames: ['grape', 'grapes', 'grapevine'],
  },
  CORN: {
    crop: 'CORN',
    displayName: 'Corn',
    scientificNames: ['zea mays'],
    commonNames: ['corn', 'maize', 'sweet corn'],
  },
  STRAWBERRY: {
    crop: 'STRAWBERRY',
    displayName: 'Strawberry',
    scientificNames: ['fragaria x ananassa', 'fragaria × ananassa', 'fragaria ananassa', 'fragaria vesca'],
    commonNames: ['strawberry', 'strawberries', 'garden strawberry'],
  },
  POTATO: {
    crop: 'POTATO',
    displayName: 'Potato',
    scientificNames: ['solanum tuberosum'],
    commonNames: ['potato', 'potatoes', 'irish potato'],
  },
  CHERRY: {
    crop: 'CHERRY',
    displayName: 'Cherry',
    scientificNames: ['prunus avium', 'prunus cerasus'],
    commonNames: ['cherry', 'cherries', 'sweet cherry', 'sour cherry', 'tart cherry'],
  },
  RASPBERRY: {
    crop: 'RASPBERRY',
    displayName: 'Raspberry',
    scientificNames: ['rubus idaeus', 'rubus occidentalis'],
    commonNames: ['raspberry', 'raspberries', 'red raspberry', 'black raspberry'],
  },
};
