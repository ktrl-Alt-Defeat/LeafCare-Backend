/**
 * Development seed data.
 *
 * Idempotent by design: every write is an `upsert` keyed on a natural key
 * (slug, email, composite key) or on a fixed UUID declared below. Running this
 * repeatedly converges on the same rows instead of duplicating them.
 *
 *   npm run db:seed
 *
 * Note on users: the platform has no authentication module yet, so
 * `password_hash` holds a deliberately non-functional marker. These accounts
 * exist to give the other tables realistic owners — they are not credentials
 * and cannot be logged into.
 */
import { PrismaClient } from '@prisma/client';
import { PLANTVILLAGE_CROPS } from './data/plantvillage-crops.js';
import { PLANTVILLAGE_DISEASES } from './data/plantvillage-diseases.js';

const prisma = new PrismaClient();

/** Not a hash. Replace when an auth module introduces real credentials. */
const NO_LOGIN = '!seed-account-no-login';

// Fixed IDs keep rows without a natural unique key idempotent across runs.
const ID = {
  userFarmer: '11111111-1111-4111-8111-111111111111',
  userExpert: '22222222-2222-4222-8222-222222222222',
  userSeller: '33333333-3333-4333-8333-333333333333',
  postBlight: 'a1111111-1111-4111-8111-111111111111',
  postSpray: 'a2222222-2222-4222-8222-222222222222',
  postMarket: 'a3333333-3333-4333-8333-333333333333',
  commentOne: 'b1111111-1111-4111-8111-111111111111',
  commentTwo: 'b2222222-2222-4222-8222-222222222222',
  order: 'd1111111-1111-4111-8111-111111111111',
  notifWeather: 'e1111111-1111-4111-8111-111111111111',
  notifReply: 'e2222222-2222-4222-8222-222222222222',
} as const;

/* -------------------------------------------------------------------------- */
/* Languages                                                                  */
/* -------------------------------------------------------------------------- */

const LANGUAGES = [
  { language_code: 'en', language_name: 'English', native_name: 'English', sort_order: 1 },
  { language_code: 'ta', language_name: 'Tamil', native_name: 'தமிழ்', sort_order: 2 },
  { language_code: 'hi', language_name: 'Hindi', native_name: 'हिन्दी', sort_order: 3 },
  { language_code: 'te', language_name: 'Telugu', native_name: 'తెలుగు', sort_order: 4 },
  { language_code: 'ml', language_name: 'Malayalam', native_name: 'മലയാളം', sort_order: 5 },
  { language_code: 'kn', language_name: 'Kannada', native_name: 'ಕನ್ನಡ', sort_order: 6 },
];

/* -------------------------------------------------------------------------- */
/* Crops                                                                      */
/* -------------------------------------------------------------------------- */

const CROPS = [
  {
    slug: 'rice',
    scientific_name: 'Oryza sativa',
    temperature_min_c: 20,
    temperature_max_c: 35,
    ph_min: 5.5,
    ph_max: 7.0,
    rainfall_min_mm: 1000,
    rainfall_max_mm: 2000,
    water_req: 'high' as const,
    sunlight: 'full_sun' as const,
    life_cycle: 'annual' as const,
    labour_req: 'high' as const,
    nutrient_unit: 'kg_per_hectare' as const,
    nitrogen_requirement: 100,
    phosphorus_requirement: 40,
    potassium_requirement: 40,
    row_spacing_cm: 20,
    plant_spacing_cm: 15,
    icon_name: 'wheat',
    seasons: ['kharif' as const],
    translations: {
      en: ['Rice', 'Staple cereal grain grown widely in paddy fields.'],
      ta: ['நெல்', 'நீர்ப்பாசன வயல்களில் பரவலாக பயிரிடப்படும் முக்கிய தானியப் பயிர்.'],
      hi: ['चावल / धान', 'धान के खेतों में व्यापक रूप से उगाया जाने वाला मुख्य अनाज।'],
      te: ['వరి', 'మాగాణి పొలాల్లో విస్తృతంగా పండించే ప్రధాన ధాన్యపు పంట.'],
      ml: ['നെല്ല്', 'നെൽവയലുകളിൽ വ്യാപകമായി കൃഷി ചെയ്യുന്ന പ്രധാന ധാന്യവിള.'],
      kn: ['ಅಕ್ಕಿ / ಭತ್ತ', 'ಗದ್ದೆಗಳಲ್ಲಿ ವ್ಯಾಪಕವಾಗಿ ಬೆಳೆಯುವ ಪ್ರಮುಖ ಧಾನ್ಯ ಬೆಳೆ.'],
    },
  },
  {
    slug: 'tomato',
    scientific_name: 'Solanum lycopersicum',
    temperature_min_c: 18,
    temperature_max_c: 30,
    ph_min: 5.5,
    ph_max: 7.0,
    rainfall_min_mm: 600,
    rainfall_max_mm: 1200,
    water_req: 'high' as const,
    sunlight: 'full_sun' as const,
    life_cycle: 'annual' as const,
    labour_req: 'high' as const,
    nutrient_unit: 'kg_per_hectare' as const,
    nitrogen_requirement: 100,
    phosphorus_requirement: 60,
    potassium_requirement: 120,
    row_spacing_cm: 75,
    plant_spacing_cm: 45,
    icon_name: 'tomato',
    seasons: ['kharif' as const, 'rabi' as const],
    translations: {
      en: ['Tomato', 'High-value vegetable crop susceptible to blight and leaf spots.'],
      ta: ['தக்காளி', 'இலைக்கருகல் நோய்களால் பாதிக்கப்படும் அதிக மதிப்புள்ள காய்கறிப் பயிர்.'],
      hi: ['टमाटर', 'अंगमारी और पत्ती धब्बा रोग के प्रति संवेदनशील उच्च मूल्य वाली सब्ज़ी फसल।'],
      te: ['టమోటా', 'ఆకుమచ్చ, ఎండు తెగుళ్లకు గురయ్యే అధిక విలువైన కూరగాయ పంట.'],
      ml: ['തക്കാളി', 'ഇലകരിച്ചിലിന് വിധേയമാകുന്ന ഉയർന്ന മൂല്യമുള്ള പച്ചക്കറി വിള.'],
      kn: ['ಟೊಮೆಟೊ', 'ಎಲೆ ಚುಕ್ಕೆ ಮತ್ತು ಅಂಗಮಾರಿ ರೋಗಕ್ಕೆ ತುತ್ತಾಗುವ ತರಕಾರಿ ಬೆಳೆ.'],
    },
  },
  {
    slug: 'wheat',
    scientific_name: 'Triticum aestivum',
    temperature_min_c: 15,
    temperature_max_c: 25,
    ph_min: 6.0,
    ph_max: 7.5,
    rainfall_min_mm: 450,
    rainfall_max_mm: 650,
    water_req: 'moderate' as const,
    sunlight: 'full_sun' as const,
    life_cycle: 'annual' as const,
    labour_req: 'medium' as const,
    nutrient_unit: 'kg_per_hectare' as const,
    nitrogen_requirement: 120,
    phosphorus_requirement: 60,
    potassium_requirement: 40,
    row_spacing_cm: 20,
    plant_spacing_cm: 5,
    icon_name: 'wheat',
    seasons: ['rabi' as const],
    translations: {
      en: ['Wheat', 'Major food grain grown during the rabi season.'],
      ta: ['கோதுமை', 'ரபி பருவத்தில் பயிரிடப்படும் முக்கிய உணவு தானியம்.'],
      hi: ['गेहूं', 'रबी मौसम में उगाया जाने वाला प्रमुख खाद्यान्न।'],
      te: ['గోధుమ', 'రబీ కాలంలో పండించే ప్రధాన ఆహార ధాన్యం.'],
      ml: ['ഗോതമ്പ്', 'റബി സീസണിൽ കൃഷി ചെയ്യുന്ന പ്രധാന ഭക്ഷ്യധാന്യം.'],
      kn: ['ಗೋಧಿ', 'ರಬಿ ಋತುವಿನಲ್ಲಿ ಬೆಳೆಯುವ ಪ್ರಮುಖ ಆಹಾರ ಧಾನ್ಯ.'],
    },
  },
  {
    slug: 'potato',
    scientific_name: 'Solanum tuberosum',
    temperature_min_c: 15,
    temperature_max_c: 20,
    ph_min: 5.0,
    ph_max: 6.5,
    rainfall_min_mm: 500,
    rainfall_max_mm: 750,
    water_req: 'moderate' as const,
    sunlight: 'full_sun' as const,
    life_cycle: 'annual' as const,
    labour_req: 'medium' as const,
    nutrient_unit: 'kg_per_hectare' as const,
    nitrogen_requirement: 120,
    phosphorus_requirement: 80,
    potassium_requirement: 150,
    row_spacing_cm: 60,
    plant_spacing_cm: 25,
    icon_name: 'potato',
    seasons: ['rabi' as const],
    translations: {
      en: ['Potato', 'Tuber crop prone to late blight and bacterial wilt.'],
      ta: ['உருளைக்கிழங்கு', 'பிந்தைய கருகல் நோய்க்கு ஆளாகும் கிழங்குப் பயிர்.'],
      hi: ['आलू', 'पछेती अंगमारी के प्रति संवेदनशील कंद फसल।'],
      te: ['బంగాళాదుంప', 'ఆలస్య ఎండు తెగులుకు గురయ్యే దుంప పంట.'],
      ml: ['ഉരുളക്കിഴങ്ങ്', 'വൈകിയ ഇലകരിച്ചിലിന് വിധേയമാകുന്ന കിഴങ്ങുവിള.'],
      kn: ['ಆಲೂಗಡ್ಡೆ', 'ತಡವಾದ ಅಂಗಮಾರಿಗೆ ತುತ್ತಾಗುವ ಗೆಡ್ಡೆ ಬೆಳೆ.'],
    },
  },
  {
    slug: 'chilli',
    scientific_name: 'Capsicum annuum',
    temperature_min_c: 20,
    temperature_max_c: 32,
    ph_min: 6.0,
    ph_max: 7.0,
    rainfall_min_mm: 600,
    rainfall_max_mm: 1000,
    water_req: 'moderate' as const,
    sunlight: 'full_sun' as const,
    life_cycle: 'annual' as const,
    labour_req: 'high' as const,
    nutrient_unit: 'kg_per_hectare' as const,
    nitrogen_requirement: 100,
    phosphorus_requirement: 50,
    potassium_requirement: 50,
    row_spacing_cm: 60,
    plant_spacing_cm: 45,
    icon_name: 'pepper',
    seasons: ['kharif' as const, 'rabi' as const],
    translations: {
      en: ['Chilli', 'Pungent spice crop affected by anthracnose and leaf curl.'],
      ta: ['மிளகாய்', 'இலைச்சுருட்டு நோயால் பாதிக்கப்படும் காரமான பயிர்.'],
      hi: ['मिर्च', 'एन्थ्रेक्नोज और पत्ती मरोड़ से प्रभावित मसाला फसल।'],
      te: ['మిరప', 'ఆకుముడత తెగులుకు గురయ్యే కారపు పంట.'],
      ml: ['മുളക്', 'ഇലചുരുളൽ രോഗം ബാധിക്കുന്ന എരിവുള്ള വിള.'],
      kn: ['ಮೆಣಸಿನಕಾಯಿ', 'ಎಲೆ ಸುರುಳಿ ರೋಗಕ್ಕೆ ತುತ್ತಾಗುವ ಖಾರದ ಬೆಳೆ.'],
    },
  },
  {
    slug: 'banana',
    scientific_name: 'Musa acuminata',
    temperature_min_c: 20,
    temperature_max_c: 30,
    ph_min: 5.5,
    ph_max: 7.0,
    rainfall_min_mm: 1500,
    rainfall_max_mm: 2500,
    humidity_min_pct: 60,
    humidity_max_pct: 80,
    water_req: 'high' as const,
    sunlight: 'full_sun' as const,
    life_cycle: 'perennial' as const,
    labour_req: 'high' as const,
    nutrient_unit: 'g_per_plant' as const,
    nitrogen_requirement: 200,
    phosphorus_requirement: 60,
    potassium_requirement: 300,
    row_spacing_cm: 250,
    plant_spacing_cm: 250,
    icon_name: 'banana',
    seasons: ['perennial' as const],
    translations: {
      en: ['Banana', 'Tropical fruit plant prone to Sigatoka leaf spot and Panama wilt.'],
      ta: ['வாழை', 'சிகடோகா இலைப்புள்ளி நோய்க்கு ஆளாகும் வெப்பமண்டல பழப் பயிர்.'],
      hi: ['केला', 'सिगाटोका पत्ती धब्बा और पनामा उकठा रोग वाला उष्णकटिबंधीय फल।'],
      te: ['అరటి', 'సిగటోకా ఆకుమచ్చ తెగులుకు గురయ్యే ఉష్ణమండల పండ్ల పంట.'],
      ml: ['വാഴ', 'സിഗട്ടോക്ക ഇലപ്പുള്ളി രോഗം ബാധിക്കുന്ന ഉഷ്ണമേഖലാ ഫലവിള.'],
      kn: ['ಬಾಳೆ', 'ಸಿಗಟೋಕಾ ಎಲೆ ಚುಕ್ಕೆ ರೋಗಕ್ಕೆ ತುತ್ತಾಗುವ ಉಷ್ಣವಲಯ ಹಣ್ಣಿನ ಬೆಳೆ.'],
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Diseases                                                                   */
/* -------------------------------------------------------------------------- */

const DISEASES = [
  {
    slug: 'tomato_early_blight',
    scientific_name: 'Alternaria solani',
    severity: 'moderate' as const,
    pathogen_type: 'fungal' as const,
    hosts: [{ crop: 'tomato', primary: true }],
    translations: {
      en: {
        disease_name: 'Tomato Early Blight',
        symptoms: [
          'Concentric dark brown circular spots with target-like rings on mature bottom leaves.',
          'Yellowing halo around dark foliage spots.',
          'Premature defoliation starting from the lower stem working upwards.',
        ],
        causes: [
          'Fungal spores surviving in plant debris or soil over winter.',
          'Warm temperature combined with frequent leaf wetness or high humidity.',
        ],
        prevention: [
          'Practice 3-year crop rotation with non-solanaceous crops like maize or beans.',
          'Maintain 60 cm spacing between plants for adequate sunlight and ventilation.',
        ],
        organic_treatment: [
          'Spray neem oil extract (5 ml per litre of water) every 7 days.',
          'Apply a copper-based bio-fungicide spray early in the morning.',
        ],
        chemical_treatment: [
          'Apply Mancozeb 75% WP @ 2.5 g/litre of water.',
          'Alternate with Chlorothalonil 75% WP @ 2 g/litre for resistance management.',
        ],
      },
      ta: {
        disease_name: 'தக்காளி இலைக்கருகல் நோய்',
        symptoms: ['பழைய இலைகளில் வளையம் போன்ற அடர் பழுப்பு புள்ளிகள்.'],
        causes: ['பயிர்க் கழிவுகளில் தங்கியிருக்கும் பூஞ்சை வித்திகள்.'],
        prevention: ['மூன்று ஆண்டு பயிர் சுழற்சியைப் பின்பற்றவும்.'],
        organic_treatment: ['வேப்ப எண்ணெய் கரைசலை 7 நாட்களுக்கு ஒருமுறை தெளிக்கவும்.'],
        chemical_treatment: ['மான்கோசெப் 75% WP @ 2.5 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'टमाटर अगेती अंगमारी',
        symptoms: ['पुरानी पत्तियों पर गोल छल्लेदार गहरे भूरे धब्बे।'],
        causes: ['पौधों के अवशेषों में जीवित रहने वाले कवक बीजाणु।'],
        prevention: ['तीन साल का फसल चक्र अपनाएँ।'],
        organic_treatment: ['नीम तेल का घोल हर 7 दिन में छिड़कें।'],
        chemical_treatment: ['मैंकोजेब 75% WP @ 2.5 ग्राम/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'rice_leaf_blast',
    scientific_name: 'Magnaporthe oryzae',
    severity: 'high' as const,
    pathogen_type: 'fungal' as const,
    hosts: [{ crop: 'rice', primary: true }],
    translations: {
      en: {
        disease_name: 'Rice Leaf Blast',
        symptoms: [
          'Spindle-shaped spots with grey-white centres and dark brown margins.',
          'Drying and burning appearance of leaf tips across the field.',
          'Rotting and breaking of panicle nodes (neck blast).',
        ],
        causes: [
          'Wind-borne fungal spores spreading rapidly in foggy morning conditions.',
          'Excessive nitrogenous fertilizer applications.',
        ],
        prevention: [
          'Use blast-resistant certified rice seeds.',
          'Maintain a balanced NPK ratio and avoid over-dosing nitrogen.',
        ],
        organic_treatment: ['Spray Pseudomonas fluorescens (10 g/L) at first symptom.'],
        chemical_treatment: ['Apply Tricyclazole 75% WP @ 0.6 g/litre of water.'],
      },
      ta: {
        disease_name: 'நெல் குலை நோய்',
        symptoms: ['இலைகளில் சிவப்பு-பழுப்பு விளிம்புகளுடன் கூரான புள்ளிகள்.'],
        causes: ['காற்று மூலம் பரவும் பூஞ்சை வித்திகள்.'],
        prevention: ['நோய் எதிர்ப்பு சான்றளிக்கப்பட்ட விதைகளைப் பயன்படுத்தவும்.'],
        organic_treatment: ['சூடோமோனாஸ் ஃபுளோரசன்ஸ் (10 கிராம்/லிட்டர்) தெளிக்கவும்.'],
        chemical_treatment: ['டிரைசைக்ளசோல் 75% WP @ 0.6 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'धान का झुलसा रोग',
        symptoms: ['पत्तियों पर भूरे किनारों वाले धुरी के आकार के धब्बे।'],
        causes: ['हवा से फैलने वाले कवक बीजाणु।'],
        prevention: ['झुलसा प्रतिरोधी प्रमाणित बीज का प्रयोग करें।'],
        organic_treatment: ['स्यूडोमोनास फ्लोरेसेंस (10 ग्राम/लीटर) छिड़कें।'],
        chemical_treatment: ['ट्राइसाइक्लाजोल 75% WP @ 0.6 ग्राम/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'late_blight',
    scientific_name: 'Phytophthora infestans',
    severity: 'severe' as const,
    pathogen_type: 'fungal' as const,
    // Deliberately attached to two hosts: the clearest demonstration of why
    // crop_diseases must be many-to-many.
    hosts: [
      { crop: 'potato', primary: true },
      { crop: 'tomato', primary: false },
    ],
    translations: {
      en: {
        disease_name: 'Late Blight',
        symptoms: [
          'Dark, water-soaked lesions on leaves with a pale green halo.',
          'White fuzzy growth on the underside of leaves in humid conditions.',
          'Firm brown rot on tubers and fruit.',
        ],
        causes: ['Spores spread by wind and rain.', 'Infected seed tubers carrying the pathogen over.'],
        prevention: ['Plant certified disease-free seed tubers.', 'Hill soil well over developing tubers.'],
        organic_treatment: ['Apply copper oxychloride preventively before rain events.'],
        chemical_treatment: ['Apply Metalaxyl + Mancozeb @ 2.5 g/litre at first report in the district.'],
      },
      ta: {
        disease_name: 'பிந்தைய கருகல் நோய்',
        symptoms: ['இலைகளில் நீர் ஊறிய அடர் நிறப் புண்கள்.'],
        causes: ['காற்று மற்றும் மழையால் பரவும் வித்திகள்.'],
        prevention: ['நோயற்ற சான்றளிக்கப்பட்ட விதைக் கிழங்குகளை நடவும்.'],
        organic_treatment: ['மழைக்கு முன் காப்பர் ஆக்ஸிகுளோரைடு தெளிக்கவும்.'],
        chemical_treatment: ['மெட்டாலாக்சில் + மான்கோசெப் @ 2.5 கிராம்/லிட்டர்.'],
      },
      hi: {
        disease_name: 'पछेती अंगमारी',
        symptoms: ['पत्तियों पर गहरे, पानी से भरे घाव।'],
        causes: ['हवा और बारिश से फैलने वाले बीजाणु।'],
        prevention: ['प्रमाणित रोग-मुक्त बीज कंद लगाएँ।'],
        organic_treatment: ['बारिश से पहले कॉपर ऑक्सीक्लोराइड का छिड़काव करें।'],
        chemical_treatment: ['मेटालैक्सिल + मैंकोजेब @ 2.5 ग्राम/लीटर।'],
      },
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Seed steps                                                                 */
/* -------------------------------------------------------------------------- */

async function seedLanguages() {
  for (const lang of LANGUAGES) {
    await prisma.languages.upsert({
      where: { language_code: lang.language_code },
      update: lang,
      create: lang,
    });
  }
  return LANGUAGES.length;
}

async function seedUsers() {
  const users = [
    {
      id: ID.userFarmer,
      name: 'Ramanathan K.',
      email: 'ramanathan@leafcare.dev',
      role: 'farmer' as const,
      language_code: 'ta',
      phone: '+91 98765 43210',
      district: 'Mayiladuthurai',
      state: 'Tamil Nadu',
      latitude: 11.103540,
      longitude: 79.655000,
      farm_size_acres: 3.5,
      experience_years: 12,
    },
    {
      id: ID.userExpert,
      name: 'Dr. Sunita Sharma',
      email: 'sunita@leafcare.dev',
      role: 'expert' as const,
      language_code: 'hi',
      district: 'Karnal',
      state: 'Haryana',
      latitude: 29.685700,
      longitude: 76.990500,
      experience_years: 20,
    },
    {
      id: ID.userSeller,
      name: 'Venkat Agri Supplies',
      email: 'venkat@leafcare.dev',
      role: 'farmer' as const,
      language_code: 'te',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      farm_size_acres: 8,
      experience_years: 7,
    },
  ];

  for (const user of users) {
    await prisma.users.upsert({
      where: { id: user.id },
      update: { ...user, password_hash: NO_LOGIN },
      create: { ...user, password_hash: NO_LOGIN },
    });
  }
  return users.length;
}

async function seedCrops() {
  // The advisory crops plus the twelve the disease model can classify. Without
  // the latter a scan of, say, an apple leaf has no catalogue row to hang its
  // guidance on.
  const allCrops = [...CROPS, ...PLANTVILLAGE_CROPS];

  for (const crop of allCrops) {
    const { seasons, translations, ...fields } = crop;

    const saved = await prisma.crops.upsert({
      where: { slug: crop.slug },
      update: fields,
      create: fields,
    });

    for (const season of seasons) {
      await prisma.crop_seasons.upsert({
        where: { crop_id_season: { crop_id: saved.id, season } },
        update: {},
        create: { crop_id: saved.id, season },
      });
    }

    for (const [language_code, [crop_name, description]] of Object.entries(translations)) {
      await prisma.crop_translations.upsert({
        where: { crop_id_language_code: { crop_id: saved.id, language_code } },
        update: { crop_name, description },
        create: { crop_id: saved.id, language_code, crop_name, description },
      });
    }
  }
  return allCrops.length;
}

async function seedCropCompanions() {
  // Stored in both directions so a single-sided query returns the full set.
  const pairs = [
    ['tomato', 'potato', 'avoid'],
    ['tomato', 'chilli', 'avoid'],
    ['rice', 'banana', 'neutral'],
  ] as const;

  let count = 0;
  for (const [a, b, relationship] of pairs) {
    const cropA = await prisma.crops.findUnique({ where: { slug: a } });
    const cropB = await prisma.crops.findUnique({ where: { slug: b } });
    if (!cropA || !cropB) continue;

    for (const [from, to] of [
      [cropA.id, cropB.id],
      [cropB.id, cropA.id],
    ]) {
      await prisma.crop_companions.upsert({
        where: { crop_id_companion_crop_id: { crop_id: from, companion_crop_id: to } },
        update: { relationship },
        create: { crop_id: from, companion_crop_id: to, relationship },
      });
      count += 1;
    }
  }
  return count;
}

async function seedDiseases() {
  // Every class the model can predict needs a row here, otherwise a scan
  // returns a disease name with no symptoms or treatment attached.
  const allDiseases = [...DISEASES, ...PLANTVILLAGE_DISEASES];

  for (const disease of allDiseases) {
    const { hosts, translations, ...fields } = disease;

    const saved = await prisma.diseases.upsert({
      where: { slug: disease.slug },
      update: fields,
      create: fields,
    });

    for (const host of hosts) {
      const crop = await prisma.crops.findUnique({ where: { slug: host.crop } });
      if (!crop) continue;
      await prisma.crop_diseases.upsert({
        where: { crop_id_disease_id: { crop_id: crop.id, disease_id: saved.id } },
        update: { is_primary_host: host.primary },
        create: { crop_id: crop.id, disease_id: saved.id, is_primary_host: host.primary },
      });
    }

    for (const [language_code, content] of Object.entries(translations)) {
      await prisma.disease_translations.upsert({
        where: { disease_id_language_code: { disease_id: saved.id, language_code } },
        update: content,
        create: { disease_id: saved.id, language_code, ...content },
      });
    }
  }
  return allDiseases.length;
}

async function seedUserCrops() {
  const selections = [
    { user_id: ID.userFarmer, slug: 'rice', is_primary: true },
    { user_id: ID.userFarmer, slug: 'tomato', is_primary: false },
    { user_id: ID.userExpert, slug: 'wheat', is_primary: true },
    { user_id: ID.userSeller, slug: 'chilli', is_primary: true },
  ];

  let count = 0;
  for (const selection of selections) {
    const crop = await prisma.crops.findUnique({ where: { slug: selection.slug } });
    if (!crop) continue;
    await prisma.user_crops.upsert({
      where: { user_id_crop_id: { user_id: selection.user_id, crop_id: crop.id } },
      update: { is_primary: selection.is_primary },
      create: { user_id: selection.user_id, crop_id: crop.id, is_primary: selection.is_primary },
    });
    count += 1;
  }
  return count;
}

async function seedCommunity() {
  const tomato = await prisma.crops.findUnique({ where: { slug: 'tomato' } });
  const rice = await prisma.crops.findUnique({ where: { slug: 'rice' } });

  const posts = [
    {
      id: ID.postBlight,
      user_id: ID.userFarmer,
      crop_id: tomato?.id ?? null,
      category: 'disease_help' as const,
      title: 'Yellow spots appearing on bottom tomato leaves after heavy rain',
      content:
        'Friends, after last night rain my 40-day tomato crop is showing round yellow spots with dark rings on lower leaves. Has anyone used Neem oil + Mancozeb spray? What is the best dose?',
    },
    {
      id: ID.postSpray,
      user_id: ID.userExpert,
      crop_id: rice?.id ?? null,
      category: 'crop_advice' as const,
      title: 'Tips for preventing neck blast in PB-1121 paddy',
      content:
        'We are in boot leaf stage. Humid morning weather is predicted next week in Haryana. What preventive bio-spray should I use before flowering starts?',
    },
    {
      id: ID.postMarket,
      user_id: ID.userSeller,
      crop_id: null,
      category: 'marketplace' as const,
      title: 'Bulk neem oil available in Guntur this week',
      content:
        'Cold-pressed neem oil, 5L cans, verified stock. Happy to answer questions on dilution rates for chilli and tomato.',
    },
  ];

  for (const post of posts) {
    await prisma.posts.upsert({ where: { id: post.id }, update: post, create: post });
  }

  const comments = [
    {
      id: ID.commentOne,
      post_id: ID.postBlight,
      user_id: ID.userExpert,
      content:
        'That looks like early blight. Start with neem oil at 5 ml/L every 7 days and remove the worst lower leaves. Only move to Mancozeb if it keeps spreading.',
    },
    {
      id: ID.commentTwo,
      post_id: ID.postBlight,
      user_id: ID.userSeller,
      content: 'We stock Trichoderma viride in Guntur if you want the bio option.',
    },
  ];

  for (const comment of comments) {
    await prisma.comments.upsert({ where: { id: comment.id }, update: comment, create: comment });
  }

  const likes = [
    { post_id: ID.postBlight, user_id: ID.userExpert },
    { post_id: ID.postBlight, user_id: ID.userSeller },
    { post_id: ID.postSpray, user_id: ID.userFarmer },
  ];

  for (const like of likes) {
    await prisma.likes.upsert({
      where: { post_id_user_id: { post_id: like.post_id, user_id: like.user_id } },
      update: {},
      create: like,
    });
  }

  return { posts: posts.length, comments: comments.length, likes: likes.length };
}

async function seedMarketplace() {
  const products = [
    {
      id: 'c1111111-1111-4111-8111-111111111111',
      seller_id: ID.userSeller,
      category: 'crop_protection' as const,
      name: 'Neem-Care Organic Bio-Fungicide (1L)',
      description: 'Cold-pressed neem oil concentrate for organic disease control.',
      price: 340,
      unit: 'bottle',
      stock_quantity: 48,
      is_organic: true,
    },
    {
      id: 'c2222222-2222-4222-8222-222222222222',
      seller_id: ID.userSeller,
      category: 'seeds' as const,
      name: 'High-Yield Hybrid Paddy Seeds (5kg)',
      description: 'Blast-tolerant hybrid paddy suited to Cauvery delta conditions.',
      price: 750,
      unit: 'bag',
      stock_quantity: 20,
    },
    {
      id: 'c3333333-3333-4333-8333-333333333333',
      seller_id: ID.userSeller,
      category: 'equipment' as const,
      name: '16L Battery Powered Knapsack Sprayer',
      description: 'Rechargeable knapsack sprayer with adjustable nozzle set.',
      price: 2450,
      unit: 'piece',
      stock_quantity: 6,
    },
  ];

  for (const product of products) {
    await prisma.products.upsert({ where: { id: product.id }, update: product, create: product });
  }

  await prisma.orders.upsert({
    where: { id: ID.order },
    update: {},
    create: {
      id: ID.order,
      buyer_id: ID.userFarmer,
      total_price: 1090,
      delivery_address: 'Plot 14, Kuthalam Road, Mayiladuthurai, Tamil Nadu 609001',
      status: 'delivered',
    },
  });

  const items = [
    { product_id: products[0].id, product_name: products[0].name, quantity: 1, unit_price: 340 },
    { product_id: products[1].id, product_name: products[1].name, quantity: 1, unit_price: 750 },
  ];

  for (const item of items) {
    await prisma.order_items.upsert({
      where: { order_id_product_id: { order_id: ID.order, product_id: item.product_id } },
      update: item,
      create: { order_id: ID.order, ...item },
    });
  }

  const reviews = [
    {
      product_id: products[0].id,
      user_id: ID.userFarmer,
      rating: 5,
      comment: 'Worked well on my tomato crop. Spots stopped spreading after two sprays.',
    },
    {
      product_id: products[0].id,
      user_id: ID.userExpert,
      rating: 4,
      comment: 'Good quality cold-pressed oil. Mix thoroughly before spraying.',
    },
    {
      product_id: products[1].id,
      user_id: ID.userFarmer,
      rating: 4,
      comment: 'Germination was strong. Will buy again next kharif.',
    },
  ];

  for (const review of reviews) {
    await prisma.reviews.upsert({
      where: {
        product_id_user_id: { product_id: review.product_id, user_id: review.user_id },
      },
      update: review,
      create: review,
    });
  }

  return { products: products.length, orders: 1, items: items.length, reviews: reviews.length };
}

async function seedKnowledgeBase() {
  const categories = [
    {
      slug: 'pests_and_diseases',
      sort_order: 1,
      names: {
        en: ['Pests & Diseases', 'Identification and treatment of common farm pathogens.'],
        ta: ['பூச்சிகள் & நோய்கள்', 'பொதுவான பயிர் நோய்களைக் கண்டறிதல் மற்றும் சிகிச்சை.'],
        hi: ['कीट और रोग', 'सामान्य फसल रोगों की पहचान और उपचार।'],
      },
    },
    {
      slug: 'cultivation_tips',
      sort_order: 2,
      names: {
        en: ['Cultivation Tips', 'Seasonal land preparation and organic soil fertility.'],
        ta: ['பயிர் சாகுபடி குறிப்புகள்', 'பருவகால நில தயாரிப்பு மற்றும் மண் வளம்.'],
        hi: ['खेती के सुझाव', 'मौसमी भूमि तैयारी और जैविक मिट्टी उर्वरता।'],
      },
    },
  ];

  let articleCount = 0;

  for (const category of categories) {
    const saved = await prisma.knowledge_categories.upsert({
      where: { slug: category.slug },
      update: { sort_order: category.sort_order },
      create: { slug: category.slug, sort_order: category.sort_order },
    });

    for (const [language_code, [category_name, description]] of Object.entries(category.names)) {
      await prisma.knowledge_category_translations.upsert({
        where: {
          category_id_language_code: { category_id: saved.id, language_code },
        },
        update: { category_name, description },
        create: { category_id: saved.id, language_code, category_name, description },
      });
    }
  }

  const pests = await prisma.knowledge_categories.findUnique({
    where: { slug: 'pests_and_diseases' },
  });
  const tips = await prisma.knowledge_categories.findUnique({
    where: { slug: 'cultivation_tips' },
  });

  const articles = [
    {
      slug: 'managing-early-blight-in-tomato',
      category_id: pests?.id,
      author_id: ID.userExpert,
      cropSlugs: ['tomato'],
      diseaseSlugs: ['tomato_early_blight'],
      translations: {
        en: {
          title: 'Managing early blight in tomato',
          summary: 'A practical field guide to spotting and stopping early blight before defoliation.',
          body:
            'Early blight rarely kills a tomato plant outright. It removes leaf area, and the yield loss follows from that. ' +
            'Scout the lowest leaves weekly from 30 days after transplanting. Remove and destroy affected leaves rather than ' +
            'composting them, mulch to stop soil splash, and water at the base. Reach for a protectant fungicide only once ' +
            'cultural controls are in place.',
        },
        ta: {
          title: 'தக்காளியில் இலைக்கருகல் நோயை நிர்வகித்தல்',
          summary: 'இலை உதிர்வதற்கு முன் நோயைக் கண்டறிந்து தடுப்பதற்கான வழிகாட்டி.',
          body:
            'இலைக்கருகல் நோய் தக்காளிச் செடியை உடனடியாகக் கொல்வதில்லை; இலைப் பரப்பைக் குறைத்து மகசூலைப் பாதிக்கிறது. ' +
            'நடவு செய்த 30 நாட்களுக்குப் பிறகு கீழ் இலைகளை வாரந்தோறும் பரிசோதிக்கவும்.',
        },
      },
    },
    {
      slug: 'balanced-npk-for-paddy',
      category_id: tips?.id,
      author_id: ID.userExpert,
      cropSlugs: ['rice'],
      diseaseSlugs: [],
      translations: {
        en: {
          title: 'Balanced NPK for paddy',
          summary: 'Why over-applying nitrogen invites blast, and how to split doses instead.',
          body:
            'Nitrogen drives tillering, but a heavy single dose produces soft, dense canopy tissue that blast infects easily. ' +
            'Split the recommended 100 kg/ha across basal, tillering and panicle initiation stages, and pair it with the full ' +
            'phosphorus and potassium requirement rather than nitrogen alone.',
        },
        hi: {
          title: 'धान के लिए संतुलित एनपीके',
          summary: 'अधिक नाइट्रोजन झुलसा रोग को क्यों बुलाता है, और खुराक कैसे बाँटें।',
          body:
            'नाइट्रोजन कल्ले बढ़ाता है, लेकिन एक बार में भारी खुराक से मुलायम और घनी पत्तियाँ बनती हैं जिन पर झुलसा आसानी से लगता है। ' +
            'अनुशंसित 100 किग्रा/हेक्टेयर को बेसल, कल्ले और बाली अवस्था में बाँटें।',
        },
      },
    },
  ];

  for (const article of articles) {
    if (!article.category_id) continue;

    const saved = await prisma.knowledge_articles.upsert({
      where: { slug: article.slug },
      update: {
        category_id: article.category_id,
        author_id: article.author_id,
        published_at: new Date('2026-08-01T00:00:00Z'),
      },
      create: {
        slug: article.slug,
        category_id: article.category_id,
        author_id: article.author_id,
        published_at: new Date('2026-08-01T00:00:00Z'),
      },
    });
    articleCount += 1;

    for (const [language_code, content] of Object.entries(article.translations)) {
      await prisma.knowledge_article_translations.upsert({
        where: { article_id_language_code: { article_id: saved.id, language_code } },
        update: content,
        create: { article_id: saved.id, language_code, ...content },
      });
    }

    for (const slug of article.cropSlugs) {
      const crop = await prisma.crops.findUnique({ where: { slug } });
      if (!crop) continue;
      await prisma.knowledge_article_crops.upsert({
        where: { article_id_crop_id: { article_id: saved.id, crop_id: crop.id } },
        update: {},
        create: { article_id: saved.id, crop_id: crop.id },
      });
    }

    for (const slug of article.diseaseSlugs) {
      const disease = await prisma.diseases.findUnique({ where: { slug } });
      if (!disease) continue;
      await prisma.knowledge_article_diseases.upsert({
        where: { article_id_disease_id: { article_id: saved.id, disease_id: disease.id } },
        update: {},
        create: { article_id: saved.id, disease_id: disease.id },
      });
    }
  }

  return { categories: categories.length, articles: articleCount };
}

async function seedNotifications() {
  const notifications = [
    {
      id: ID.notifWeather,
      user_id: ID.userFarmer,
      type: 'weather_alert' as const,
      title: 'Heavy rain expected tomorrow',
      message: 'Rain is forecast in Mayiladuthurai within 18 hours. Delay any planned spraying.',
      link_url: '/home',
    },
    {
      id: ID.notifReply,
      user_id: ID.userFarmer,
      type: 'community_reply' as const,
      title: 'Dr. Sunita Sharma replied to your question',
      message: 'That looks like early blight. Start with neem oil at 5 ml/L every 7 days.',
      link_url: '/community',
    },
  ];

  for (const notification of notifications) {
    await prisma.notifications.upsert({
      where: { id: notification.id },
      update: notification,
      create: notification,
    });
  }
  return notifications.length;
}

/* -------------------------------------------------------------------------- */
/* Runner                                                                     */
/* -------------------------------------------------------------------------- */

async function main() {
  console.warn('Seeding LeafCare development data...\n');

  console.warn(`  languages         ${await seedLanguages()}`);
  console.warn(`  users             ${await seedUsers()}`);
  console.warn(`  crops             ${await seedCrops()}`);
  console.warn(`  crop_companions   ${await seedCropCompanions()}`);
  console.warn(`  diseases          ${await seedDiseases()}`);
  console.warn(`  user_crops        ${await seedUserCrops()}`);

  const community = await seedCommunity();
  console.warn(
    `  community         ${community.posts} posts, ${community.comments} comments, ${community.likes} likes`
  );

  const market = await seedMarketplace();
  console.warn(
    `  marketplace       ${market.products} products, ${market.orders} order, ${market.items} items, ${market.reviews} reviews`
  );

  const knowledge = await seedKnowledgeBase();
  console.warn(`  knowledge base    ${knowledge.categories} categories, ${knowledge.articles} articles`);
  console.warn(`  notifications     ${await seedNotifications()}`);

  console.warn('\nSeed complete. Re-running is safe — every write is an upsert.');
  console.warn(
    'prediction_history is intentionally NOT seeded: those rows are produced by the AI\n' +
      'inference service, and fabricating them would misrepresent model output.'
  );
}

main()
  .catch((error) => {
    console.error('\nSeed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
