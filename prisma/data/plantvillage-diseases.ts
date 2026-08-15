/**
 * Disease records matching the classes the EfficientNetV2-S model predicts.
 *
 * Without these, a scan returns a label the catalogue cannot resolve, so the
 * farmer sees a name with no symptoms, prevention or treatment attached.
 * Slugs mirror the model's PlantVillage class names (lowercased, `___`
 * replaced by `_`) so `crop___disease` maps onto one row here.
 *
 * English carries the full agronomic detail; Tamil and Hindi carry the
 * essential line for each section, matching the existing seed's convention.
 *
 * Dosages are typical label rates. Farmers must follow the product label and
 * local extension guidance, which the disclaimer in the API surfaces.
 */

export interface DiseaseTranslationSeed {
  disease_name: string;
  symptoms: string[];
  causes: string[];
  prevention: string[];
  organic_treatment: string[];
  chemical_treatment: string[];
}

export interface PlantVillageDiseaseSeed {
  slug: string;
  scientific_name: string;
  severity: 'low' | 'moderate' | 'high' | 'severe';
  pathogen_type: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'deficiency';
  contagious: boolean;
  hosts: Array<{ crop: string; primary: boolean }>;
  translations: Record<string, DiseaseTranslationSeed>;
}

export const PLANTVILLAGE_DISEASES: PlantVillageDiseaseSeed[] = [
  /* ---------------------------------------------------------------- Apple */
  {
    slug: 'apple_scab',
    scientific_name: 'Venturia inaequalis',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'apple', primary: true }],
    translations: {
      en: {
        disease_name: 'Apple Scab',
        symptoms: [
          'Olive-green to brown velvety blotches on the upper leaf surface.',
          'Corky, cracked dark lesions on the fruit skin that deform it as it grows.',
          'Heavy early defoliation in wet springs, weakening the tree for next season.',
        ],
        causes: [
          'Spores released from infected fallen leaves during spring rain.',
          'Prolonged leaf wetness at 15-22 °C, which the fungus needs to germinate.',
        ],
        prevention: [
          'Rake and destroy fallen leaves in winter to remove the overwintering source.',
          'Prune the canopy open so leaves dry quickly after rain or dew.',
          'Plant scab-resistant cultivars where available.',
        ],
        organic_treatment: [
          'Apply wettable sulphur at green-tip and repeat every 7-10 days through wet weather.',
          'Spray a lime-sulphur or potassium bicarbonate solution before rain events.',
        ],
        chemical_treatment: [
          'Apply Mancozeb 75% WP @ 2.5 g/litre from green-tip stage.',
          'Alternate with Difenoconazole 25% EC @ 0.5 ml/litre to manage resistance.',
        ],
      },
      ta: {
        disease_name: 'ஆப்பிள் சொறி நோய்',
        symptoms: ['இலையின் மேற்பரப்பில் ஆலிவ் பச்சை முதல் பழுப்பு நிற திட்டுகள்.'],
        causes: ['விழுந்த பாதிக்கப்பட்ட இலைகளிலிருந்து வெளியாகும் வித்திகள்.'],
        prevention: ['குளிர்காலத்தில் விழுந்த இலைகளை அகற்றி அழிக்கவும்.'],
        organic_treatment: ['நனையும் கந்தகத்தை 7-10 நாட்களுக்கு ஒருமுறை தெளிக்கவும்.'],
        chemical_treatment: ['மான்கோசெப் 75% WP @ 2.5 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'सेब स्कैब',
        symptoms: ['पत्ती की ऊपरी सतह पर जैतूनी-हरे से भूरे मखमली धब्बे।'],
        causes: ['गिरी हुई संक्रमित पत्तियों से वसंत की बारिश में निकलने वाले बीजाणु।'],
        prevention: ['सर्दियों में गिरी पत्तियाँ इकट्ठा कर नष्ट करें।'],
        organic_treatment: ['घुलनशील गंधक का छिड़काव हर 7-10 दिन में करें।'],
        chemical_treatment: ['मैंकोजेब 75% WP @ 2.5 ग्राम/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'apple_black_rot',
    scientific_name: 'Botryosphaeria obtusa',
    severity: 'high',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'apple', primary: true }],
    translations: {
      en: {
        disease_name: 'Apple Black Rot',
        symptoms: [
          'Purple-bordered "frog-eye" leaf spots with tan centres.',
          'Firm brown fruit rot spreading in concentric rings, often from the calyx end.',
          'Sunken cankers on limbs that girdle and kill branches.',
        ],
        causes: [
          'Fungus overwintering in cankers, mummified fruit and dead wood.',
          'Warm, humid weather driving spore release onto wounded or stressed tissue.',
        ],
        prevention: [
          'Prune out cankered wood and remove mummified fruit from the tree and ground.',
          'Avoid bark injuries during orchard operations; the fungus enters through wounds.',
          'Keep trees vigorous with balanced nutrition and irrigation.',
        ],
        organic_treatment: [
          'Apply a copper oxychloride spray at bud break and after pruning cuts.',
          'Paint large pruning wounds with a copper paste to block entry.',
        ],
        chemical_treatment: [
          'Apply Captan 50% WP @ 2 g/litre at pink bud and repeat at petal fall.',
          'Use Thiophanate-methyl 70% WP @ 1 g/litre where cankers are widespread.',
        ],
      },
      ta: {
        disease_name: 'ஆப்பிள் கருஞ்சிதைவு நோய்',
        symptoms: ['ஊதா நிற விளிம்புடன் தவளைக்கண் போன்ற இலைப் புள்ளிகள்.'],
        causes: ['புற்றுக்கட்டிகள் மற்றும் காய்ந்த பழங்களில் தங்கியிருக்கும் பூஞ்சை.'],
        prevention: ['பாதிக்கப்பட்ட கிளைகளை கத்தரித்து அகற்றவும்.'],
        organic_treatment: ['தாமிர ஆக்சிகுளோரைடு கரைசலைத் தெளிக்கவும்.'],
        chemical_treatment: ['கேப்டான் 50% WP @ 2 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'सेब ब्लैक रॉट',
        symptoms: ['बैंगनी किनारों वाले "मेंढक-आँख" पत्ती धब्बे।'],
        causes: ['कैंकर और सूखे फलों में जीवित रहने वाला कवक।'],
        prevention: ['कैंकर वाली टहनियाँ काटकर हटाएँ और सूखे फल नष्ट करें।'],
        organic_treatment: ['कॉपर ऑक्सीक्लोराइड का छिड़काव करें।'],
        chemical_treatment: ['कैप्टान 50% WP @ 2 ग्राम/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'apple_cedar_apple_rust',
    scientific_name: 'Gymnosporangium juniperi-virginianae',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'apple', primary: true }],
    translations: {
      en: {
        disease_name: 'Cedar Apple Rust',
        symptoms: [
          'Bright orange-yellow spots on the upper leaf surface.',
          'Tube-like fruiting structures protruding from the underside of those spots.',
          'Distorted, prematurely dropped fruit in severe infections.',
        ],
        causes: [
          'A fungus needing both apple and nearby juniper or cedar to complete its cycle.',
          'Spring rain moving spores from galls on juniper to opening apple leaves.',
        ],
        prevention: [
          'Remove juniper and red cedar within a few hundred metres of the orchard where practical.',
          'Plant rust-resistant apple cultivars in areas with heavy cedar populations.',
          'Scout junipers in early spring and cut out the orange gelatinous galls.',
        ],
        organic_treatment: [
          'Apply wettable sulphur from pink bud through to two weeks after petal fall.',
          'Spray during the infection window rather than after symptoms appear.',
        ],
        chemical_treatment: [
          'Apply Myclobutanil 10% WP @ 1 g/litre at pink bud stage.',
          'Repeat at 10-14 day intervals while juniper galls remain active.',
        ],
      },
      ta: {
        disease_name: 'சிடார் ஆப்பிள் துரு நோய்',
        symptoms: ['இலையின் மேற்பரப்பில் பிரகாசமான ஆரஞ்சு-மஞ்சள் புள்ளிகள்.'],
        causes: ['ஆப்பிள் மற்றும் அருகிலுள்ள சிடார் மரங்கள் இரண்டையும் தேவைப்படும் பூஞ்சை.'],
        prevention: ['தோட்டத்திற்கு அருகில் உள்ள சிடார் மரங்களை அகற்றவும்.'],
        organic_treatment: ['நனையும் கந்தகத்தை பூ மொட்டு நிலையில் தெளிக்கவும்.'],
        chemical_treatment: ['மைக்ளோபுட்டானில் 10% WP @ 1 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'सीडर एप्पल रस्ट',
        symptoms: ['पत्ती की ऊपरी सतह पर चमकीले नारंगी-पीले धब्बे।'],
        causes: ['सेब और पास के देवदार दोनों की आवश्यकता वाला कवक।'],
        prevention: ['बाग के पास के जुनिपर/देवदार पेड़ हटाएँ।'],
        organic_treatment: ['गुलाबी कली अवस्था से घुलनशील गंधक छिड़कें।'],
        chemical_treatment: ['मायक्लोब्यूटानिल 10% WP @ 1 ग्राम/लीटर छिड़कें।'],
      },
    },
  },

  /* --------------------------------------------------------------- Cherry */
  {
    slug: 'cherry_powdery_mildew',
    scientific_name: 'Podosphaera clandestina',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'cherry', primary: true }],
    translations: {
      en: {
        disease_name: 'Cherry Powdery Mildew',
        symptoms: [
          'White powdery patches on young leaves and shoot tips.',
          'Upward curling and puckering of affected new growth.',
          'Powdery film on fruit stems that downgrades market quality.',
        ],
        causes: [
          'Fungus overwintering in dormant buds and infected shoots.',
          'Warm days with cool humid nights, which suit spore germination without free water.',
        ],
        prevention: [
          'Prune to open the canopy and reduce humidity around the fruit.',
          'Avoid excess nitrogen, which pushes the soft new growth the fungus prefers.',
          'Remove and destroy infected suckers and water sprouts.',
        ],
        organic_treatment: [
          'Spray potassium bicarbonate @ 5 g/litre with a wetting agent at first sign.',
          'Apply a milk-and-water solution or wettable sulphur on a 7-day cycle.',
        ],
        chemical_treatment: [
          'Apply Hexaconazole 5% EC @ 2 ml/litre at shuck fall.',
          'Alternate with a strobilurin such as Azoxystrobin 23% SC @ 1 ml/litre.',
        ],
      },
      ta: {
        disease_name: 'செர்ரி சாம்பல் நோய்',
        symptoms: ['இளம் இலைகளில் வெண்மையான பொடி போன்ற திட்டுகள்.'],
        causes: ['செயலற்ற மொட்டுகளில் தங்கியிருக்கும் பூஞ்சை.'],
        prevention: ['மரத்தை கத்தரித்து காற்றோட்டத்தை அதிகரிக்கவும்.'],
        organic_treatment: ['பொட்டாசியம் பைகார்பனேட் @ 5 கிராம்/லிட்டர் தெளிக்கவும்.'],
        chemical_treatment: ['ஹெக்ஸாகோனசோல் 5% EC @ 2 மிலி/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'चेरी चूर्णिल आसिता',
        symptoms: ['नई पत्तियों पर सफेद चूर्ण जैसे धब्बे।'],
        causes: ['सुप्त कलियों में जीवित रहने वाला कवक।'],
        prevention: ['छत्र को खोलने के लिए छँटाई करें।'],
        organic_treatment: ['पोटैशियम बाइकार्बोनेट @ 5 ग्राम/लीटर छिड़कें।'],
        chemical_treatment: ['हेक्साकोनाज़ोल 5% EC @ 2 मिली/लीटर छिड़कें।'],
      },
    },
  },

  /* ----------------------------------------------------------------- Corn */
  {
    slug: 'corn_gray_leaf_spot',
    scientific_name: 'Cercospora zeae-maydis',
    severity: 'high',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'corn', primary: true }],
    translations: {
      en: {
        disease_name: 'Corn Gray Leaf Spot',
        symptoms: [
          'Narrow, rectangular tan-to-grey lesions running parallel to the leaf veins.',
          'Lesions merging into large blighted areas that kill the leaf.',
          'Loss of upper leaves during grain fill, cutting yield sharply.',
        ],
        causes: [
          'Fungus surviving in maize residue left on the soil surface.',
          'Extended humid periods above 90% with warm temperatures.',
        ],
        prevention: [
          'Rotate away from maize for at least one season to break the residue cycle.',
          'Plough in or remove infected residue after harvest.',
          'Choose hybrids rated tolerant to grey leaf spot.',
        ],
        organic_treatment: [
          'Improve airflow through wider row spacing and balanced plant population.',
          'Apply a Trichoderma-based residue decomposer after harvest.',
        ],
        chemical_treatment: [
          'Apply Azoxystrobin 23% SC @ 1 ml/litre at tasselling.',
          'Use Propiconazole 25% EC @ 1 ml/litre when lesions reach the ear leaf.',
        ],
      },
      ta: {
        disease_name: 'சோள சாம்பல் இலைப்புள்ளி நோய்',
        symptoms: ['இலை நரம்புகளுக்கு இணையாக நீண்ட செவ்வக சாம்பல் புள்ளிகள்.'],
        causes: ['மண்ணின் மேற்பரப்பில் உள்ள சோளக் கழிவுகளில் தங்கும் பூஞ்சை.'],
        prevention: ['ஒரு பருவமாவது பயிர் சுழற்சி செய்யவும்.'],
        organic_treatment: ['அறுவடைக்குப் பின் டிரைக்கோடெர்மா கரைப்பானைப் பயன்படுத்தவும்.'],
        chemical_treatment: ['அசோக்சிஸ்ட்ரோபின் 23% SC @ 1 மிலி/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'मक्का ग्रे लीफ स्पॉट',
        symptoms: ['शिराओं के समानांतर लंबे आयताकार भूरे-स्लेटी धब्बे।'],
        causes: ['मिट्टी की सतह पर बचे मक्का अवशेषों में जीवित कवक।'],
        prevention: ['कम से कम एक मौसम के लिए फसल चक्र अपनाएँ।'],
        organic_treatment: ['कटाई के बाद ट्राइकोडर्मा अपघटक डालें।'],
        chemical_treatment: ['एज़ोक्सिस्ट्रोबिन 23% SC @ 1 मिली/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'corn_common_rust',
    scientific_name: 'Puccinia sorghi',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'corn', primary: true }],
    translations: {
      en: {
        disease_name: 'Corn Common Rust',
        symptoms: [
          'Small cinnamon-brown powdery pustules scattered on both leaf surfaces.',
          'Pustules rupturing the leaf surface and turning dark as they mature.',
          'Yellowing and early death of heavily infected leaves.',
        ],
        causes: [
          'Wind-blown spores arriving from other maize-growing regions.',
          'Cool, moist conditions between 16-23 °C with heavy dew.',
        ],
        prevention: [
          'Sow early so the crop passes its susceptible stage before peak spore load.',
          'Grow resistant hybrids in regions with a history of rust.',
          'Avoid dense planting that keeps the canopy wet.',
        ],
        organic_treatment: [
          'Spray a sulphur-based fungicide at first pustule appearance.',
          'Remove and destroy volunteer maize plants that carry the fungus between seasons.',
        ],
        chemical_treatment: [
          'Apply Propiconazole 25% EC @ 1 ml/litre at first sign of pustules.',
          'Repeat after 15 days if the weather stays cool and wet.',
        ],
      },
      ta: {
        disease_name: 'சோள துரு நோய்',
        symptoms: ['இலையின் இரு பக்கங்களிலும் இலவங்கப்பட்டை நிற பொடிப் புண்கள்.'],
        causes: ['காற்றின் மூலம் பரவும் வித்திகள்.'],
        prevention: ['முன்கூட்டியே விதைத்து நோய் காலத்தைத் தவிர்க்கவும்.'],
        organic_treatment: ['கந்தக அடிப்படையிலான பூஞ்சைக்கொல்லியைத் தெளிக்கவும்.'],
        chemical_treatment: ['புரோபிகோனசோல் 25% EC @ 1 மிலி/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'मक्का सामान्य रस्ट',
        symptoms: ['पत्ती की दोनों सतहों पर दालचीनी-भूरे चूर्णिल फफोले।'],
        causes: ['हवा से आने वाले बीजाणु।'],
        prevention: ['जल्दी बुवाई करें ताकि संवेदनशील अवस्था बच जाए।'],
        organic_treatment: ['गंधक आधारित कवकनाशी छिड़कें।'],
        chemical_treatment: ['प्रोपिकोनाज़ोल 25% EC @ 1 मिली/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'corn_northern_leaf_blight',
    scientific_name: 'Exserohilum turcicum',
    severity: 'high',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'corn', primary: true }],
    translations: {
      en: {
        disease_name: 'Northern Corn Leaf Blight',
        symptoms: [
          'Long cigar-shaped grey-green lesions, often 3-15 cm, on the lower leaves first.',
          'Lesions turning tan and spreading upward toward the ear leaf.',
          'Severe blighting that makes the field look scorched before maturity.',
        ],
        causes: [
          'Fungus overwintering in infected maize debris.',
          'Moderate temperatures of 18-27 °C with long dew periods.',
        ],
        prevention: [
          'Rotate with non-host crops such as soybean or pulses.',
          'Bury residue by deep ploughing after harvest.',
          'Select hybrids carrying northern leaf blight resistance genes.',
        ],
        organic_treatment: [
          'Apply Trichoderma viride to decompose infected residue after harvest.',
          'Maintain balanced potassium, which improves the plant tolerance to blight.',
        ],
        chemical_treatment: [
          'Apply Mancozeb 75% WP @ 2.5 g/litre at first lesion.',
          'Follow with Azoxystrobin 23% SC @ 1 ml/litre if disease reaches the ear leaf.',
        ],
      },
      ta: {
        disease_name: 'சோள வடக்கு இலைக்கருகல் நோய்',
        symptoms: ['கீழ் இலைகளில் நீளமான சுருட்டு வடிவ சாம்பல்-பச்சை புண்கள்.'],
        causes: ['பாதிக்கப்பட்ட சோளக் கழிவுகளில் தங்கும் பூஞ்சை.'],
        prevention: ['சோயாபீன் போன்ற பயிர்களுடன் சுழற்சி செய்யவும்.'],
        organic_treatment: ['அறுவடைக்குப் பின் டிரைக்கோடெர்மா விரிடி பயன்படுத்தவும்.'],
        chemical_treatment: ['மான்கோசெப் 75% WP @ 2.5 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'मक्का उत्तरी पत्ती अंगमारी',
        symptoms: ['निचली पत्तियों पर लंबे सिगार आकार के भूरे-हरे धब्बे।'],
        causes: ['संक्रमित मक्का अवशेषों में जीवित कवक।'],
        prevention: ['सोयाबीन जैसी गैर-पोषक फसलों के साथ चक्र अपनाएँ।'],
        organic_treatment: ['कटाई के बाद ट्राइकोडर्मा विरिडी डालें।'],
        chemical_treatment: ['मैंकोजेब 75% WP @ 2.5 ग्राम/लीटर छिड़कें।'],
      },
    },
  },

  /* ---------------------------------------------------------------- Grape */
  {
    slug: 'grape_black_rot',
    scientific_name: 'Guignardia bidwellii',
    severity: 'severe',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'grape', primary: true }],
    translations: {
      en: {
        disease_name: 'Grape Black Rot',
        symptoms: [
          'Circular tan leaf spots with dark borders and tiny black dots inside.',
          'Berries turning brown, then shrivelling into hard black mummies on the bunch.',
          'Elongated dark lesions on shoots and tendrils.',
        ],
        causes: [
          'Fungus overwintering in mummified berries and cane lesions.',
          'Warm wet spring weather during the highly susceptible period from bloom to bunch closure.',
        ],
        prevention: [
          'Remove every mummified berry from the vine and the ground during dormant pruning.',
          'Train vines for open canopy so bunches dry quickly.',
          'Avoid overhead irrigation during flowering and fruit set.',
        ],
        organic_treatment: [
          'Apply copper oxychloride @ 3 g/litre from shoot growth through fruit set.',
          'Strip and burn infected bunches as soon as mummies appear.',
        ],
        chemical_treatment: [
          'Apply Mancozeb 75% WP @ 2 g/litre before bloom.',
          'Follow with Myclobutanil 10% WP @ 1 g/litre through the bloom to bunch-close window.',
        ],
      },
      ta: {
        disease_name: 'திராட்சை கருஞ்சிதைவு நோய்',
        symptoms: ['பழங்கள் பழுப்பாகி கடினமான கருப்பு மம்மியாக சுருங்குகின்றன.'],
        causes: ['சுருங்கிய பழங்களில் தங்கியிருக்கும் பூஞ்சை.'],
        prevention: ['கத்தரிக்கும் போது சுருங்கிய பழங்களை முழுவதுமாக அகற்றவும்.'],
        organic_treatment: ['தாமிர ஆக்சிகுளோரைடு @ 3 கிராம்/லிட்டர் தெளிக்கவும்.'],
        chemical_treatment: ['மான்கோசெப் 75% WP @ 2 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'अंगूर ब्लैक रॉट',
        symptoms: ['बेरियाँ भूरी होकर कठोर काली ममी में सिकुड़ जाती हैं।'],
        causes: ['सूखी ममीकृत बेरियों में जीवित रहने वाला कवक।'],
        prevention: ['छँटाई के समय सभी ममीकृत बेरियाँ हटा दें।'],
        organic_treatment: ['कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर छिड़कें।'],
        chemical_treatment: ['मैंकोजेब 75% WP @ 2 ग्राम/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'grape_esca_black_measles',
    scientific_name: 'Phaeomoniella chlamydospora',
    severity: 'severe',
    pathogen_type: 'fungal',
    contagious: false,
    hosts: [{ crop: 'grape', primary: true }],
    translations: {
      en: {
        disease_name: 'Grape Esca (Black Measles)',
        symptoms: [
          'Tiger-stripe pattern of yellow or red bands between the veins of mature leaves.',
          'Small dark spots speckling the berries, which may crack.',
          'Sudden collapse of an entire vine in mid-summer heat (apoplexy).',
        ],
        causes: [
          'Wood-decay fungi colonising the trunk through large pruning wounds.',
          'Stress from drought or heat, which triggers the sudden dieback phase.',
        ],
        prevention: [
          'Prune late in the dormant season when wounds heal fastest.',
          'Make small pruning cuts and seal large ones with a wound protectant.',
          'Remove and burn vines that have collapsed; the trunk is the reservoir.',
        ],
        organic_treatment: [
          'Apply a Trichoderma-based wound dressing immediately after pruning.',
          'Maintain steady irrigation to avoid the water stress that triggers collapse.',
        ],
        chemical_treatment: [
          'No curative spray exists once the trunk is colonised; manage by sanitation.',
          'Protect fresh pruning wounds with a thiophanate-methyl paste.',
        ],
      },
      ta: {
        disease_name: 'திராட்சை எஸ்கா நோய்',
        symptoms: ['முதிர்ந்த இலைகளில் புலி-கோடு போன்ற மஞ்சள் அல்லது சிவப்பு பட்டைகள்.'],
        causes: ['பெரிய கத்தரிப்பு காயங்கள் வழியாக தண்டுக்குள் நுழையும் பூஞ்சை.'],
        prevention: ['செயலற்ற காலத்தின் இறுதியில் கத்தரிக்கவும்; காயங்களை மூடவும்.'],
        organic_treatment: ['கத்தரித்த உடனேயே டிரைக்கோடெர்மா பூச்சு இடவும்.'],
        chemical_treatment: ['நோய் தீர்க்கும் மருந்து இல்லை; சுகாதாரமே தீர்வு.'],
      },
      hi: {
        disease_name: 'अंगूर एस्का (ब्लैक मीज़ल्स)',
        symptoms: ['परिपक्व पत्तियों पर बाघ-धारी जैसी पीली या लाल पट्टियाँ।'],
        causes: ['बड़े छँटाई घावों से तने में प्रवेश करने वाले कवक।'],
        prevention: ['सुप्तावस्था के अंत में छँटाई करें और घाव सील करें।'],
        organic_treatment: ['छँटाई के तुरंत बाद ट्राइकोडर्मा लेप लगाएँ।'],
        chemical_treatment: ['कोई उपचारात्मक स्प्रे नहीं; स्वच्छता ही प्रबंधन है।'],
      },
    },
  },
  {
    slug: 'grape_leaf_blight',
    scientific_name: 'Pseudocercospora vitis',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'grape', primary: true }],
    translations: {
      en: {
        disease_name: 'Grape Leaf Blight (Isariopsis Leaf Spot)',
        symptoms: [
          'Irregular dark brown angular patches bounded by the leaf veins.',
          'Grey mouldy growth on the underside of the spots in humid weather.',
          'Early leaf fall that exposes bunches to sunburn.',
        ],
        causes: [
          'Fungus surviving on fallen infected leaves.',
          'Extended monsoon humidity with temperatures near 25 °C.',
        ],
        prevention: [
          'Collect and destroy fallen leaves at the end of the season.',
          'Manage canopy density so the lower leaves receive light and air.',
          'Avoid wetting foliage during evening irrigation.',
        ],
        organic_treatment: [
          'Spray Bordeaux mixture 1% at the onset of the monsoon.',
          'Apply neem-based formulations on a 10-day cycle during wet spells.',
        ],
        chemical_treatment: [
          'Apply Mancozeb 75% WP @ 2 g/litre at first symptoms.',
          'Alternate with Carbendazim 50% WP @ 1 g/litre in prolonged wet weather.',
        ],
      },
      ta: {
        disease_name: 'திராட்சை இலைக்கருகல் நோய்',
        symptoms: ['இலை நரம்புகளால் வரையறுக்கப்பட்ட ஒழுங்கற்ற அடர் பழுப்பு திட்டுகள்.'],
        causes: ['விழுந்த பாதிக்கப்பட்ட இலைகளில் தங்கும் பூஞ்சை.'],
        prevention: ['பருவ முடிவில் விழுந்த இலைகளை சேகரித்து அழிக்கவும்.'],
        organic_treatment: ['பருவமழை தொடக்கத்தில் 1% போர்டோ கலவை தெளிக்கவும்.'],
        chemical_treatment: ['மான்கோசெப் 75% WP @ 2 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'अंगूर पत्ती अंगमारी',
        symptoms: ['शिराओं से घिरे अनियमित गहरे भूरे कोणीय धब्बे।'],
        causes: ['गिरी हुई संक्रमित पत्तियों पर जीवित कवक।'],
        prevention: ['मौसम के अंत में गिरी पत्तियाँ नष्ट करें।'],
        organic_treatment: ['मानसून की शुरुआत में 1% बोर्डो मिश्रण छिड़कें।'],
        chemical_treatment: ['मैंकोजेब 75% WP @ 2 ग्राम/लीटर छिड़कें।'],
      },
    },
  },

  /* --------------------------------------------------------------- Orange */
  {
    slug: 'orange_haunglongbing',
    scientific_name: 'Candidatus Liberibacter asiaticus',
    severity: 'severe',
    pathogen_type: 'bacterial',
    contagious: true,
    hosts: [{ crop: 'orange', primary: true }],
    translations: {
      en: {
        disease_name: 'Citrus Greening (Huanglongbing)',
        symptoms: [
          'Blotchy asymmetric yellow mottling across the leaf, not matching on either side of the midrib.',
          'Small lopsided fruit that stays green at the base and tastes bitter.',
          'Twig dieback and heavy premature fruit drop.',
        ],
        causes: [
          'A phloem-limited bacterium spread by the Asian citrus psyllid.',
          'Planting infected nursery stock or budwood from an unverified source.',
        ],
        prevention: [
          'Buy only certified disease-free planting material.',
          'Control psyllid populations, as the insect is the only field vector.',
          'Remove and destroy infected trees promptly; they cannot be cured and act as a reservoir.',
        ],
        organic_treatment: [
          'Release Tamarixia radiata, a parasitoid wasp that suppresses psyllid numbers.',
          'Spray neem oil to deter psyllid feeding on new flush.',
        ],
        chemical_treatment: [
          'Control the vector with Imidacloprid 17.8% SL @ 0.3 ml/litre on new flush.',
          'There is no chemical cure for infected trees; removal is the control measure.',
        ],
      },
      ta: {
        disease_name: 'சிட்ரஸ் பசுமை நோய்',
        symptoms: ['இலையில் சமச்சீரற்ற மஞ்சள் திட்டுகள்; பழங்கள் சிறியதாக கசப்பாக இருக்கும்.'],
        causes: ['சிட்ரஸ் சைலிட் பூச்சியால் பரவும் பாக்டீரியா.'],
        prevention: ['சான்றளிக்கப்பட்ட நோயற்ற நாற்றுகளை மட்டுமே நடவும்.'],
        organic_treatment: ['சைலிட் பூச்சியை விரட்ட வேப்ப எண்ணெய் தெளிக்கவும்.'],
        chemical_treatment: ['இமிடாகுளோபிரிட் 17.8% SL @ 0.3 மிலி/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'सिट्रस ग्रीनिंग (हुआंगलोंगबिंग)',
        symptoms: ['पत्तियों पर असममित पीले धब्बे; फल छोटे, टेढ़े और कड़वे।'],
        causes: ['सिट्रस सिल्ला कीट द्वारा फैलने वाला जीवाणु।'],
        prevention: ['केवल प्रमाणित रोगमुक्त पौधे लगाएँ।'],
        organic_treatment: ['सिल्ला को रोकने के लिए नीम तेल छिड़कें।'],
        chemical_treatment: ['इमिडाक्लोप्रिड 17.8% SL @ 0.3 मिली/लीटर छिड़कें।'],
      },
    },
  },

  /* ---------------------------------------------------------------- Peach */
  {
    slug: 'peach_bacterial_spot',
    scientific_name: 'Xanthomonas arboricola pv. pruni',
    severity: 'high',
    pathogen_type: 'bacterial',
    contagious: true,
    hosts: [{ crop: 'peach', primary: true }],
    translations: {
      en: {
        disease_name: 'Peach Bacterial Spot',
        symptoms: [
          'Small angular purple-black leaf spots whose centres drop out, giving a shot-hole look.',
          'Sunken dark pits and cracks on the fruit surface.',
          'Heavy defoliation that exposes fruit and weakens the tree.',
        ],
        causes: [
          'Bacteria overwintering in twig cankers and bud scales.',
          'Wind-driven rain and sandy sites, which spread and abrade tissue.',
        ],
        prevention: [
          'Plant tolerant cultivars; susceptibility varies widely between varieties.',
          'Establish windbreaks to reduce sand abrasion and splash spread.',
          'Avoid overhead irrigation and prune out cankered twigs in dormancy.',
        ],
        organic_treatment: [
          'Apply a low-rate copper spray at leaf fall and again at bud swell.',
          'Keep copper rates low in the growing season to avoid phytotoxicity on peach.',
        ],
        chemical_treatment: [
          'Apply Oxytetracycline @ 0.5 g/litre during early fruit development.',
          'Use copper hydroxide at dormant timing; high in-season rates burn the foliage.',
        ],
      },
      ta: {
        disease_name: 'பீச் பாக்டீரியா புள்ளி நோய்',
        symptoms: ['இலைகளில் சிறிய ஊதா-கருப்பு புள்ளிகள்; நடுப்பகுதி விழுந்து துளை போல் தோன்றும்.'],
        causes: ['கிளைப் புற்றுகளில் தங்கியிருக்கும் பாக்டீரியா.'],
        prevention: ['தாங்கும் ரகங்களை நடவும்; காற்றுத் தடுப்பு அமைக்கவும்.'],
        organic_treatment: ['இலை உதிர்வின் போது குறைந்த அளவு தாமிரம் தெளிக்கவும்.'],
        chemical_treatment: ['ஆக்சிடெட்ராசைக்ளின் @ 0.5 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'आड़ू जीवाणु धब्बा',
        symptoms: ['पत्तियों पर छोटे कोणीय बैंगनी-काले धब्बे, बीच गिरकर छेद जैसा।'],
        causes: ['टहनी कैंकर में जीवित रहने वाले जीवाणु।'],
        prevention: ['सहनशील किस्में लगाएँ और हवा-रोक लगाएँ।'],
        organic_treatment: ['पत्ती गिरने पर कम मात्रा में कॉपर छिड़कें।'],
        chemical_treatment: ['ऑक्सीटेट्रासाइक्लिन @ 0.5 ग्राम/लीटर छिड़कें।'],
      },
    },
  },

  /* ----------------------------------------------------------- Bell pepper */
  {
    slug: 'bell_pepper_bacterial_spot',
    scientific_name: 'Xanthomonas campestris pv. vesicatoria',
    severity: 'high',
    pathogen_type: 'bacterial',
    contagious: true,
    hosts: [{ crop: 'bell_pepper', primary: true }],
    translations: {
      en: {
        disease_name: 'Bell Pepper Bacterial Spot',
        symptoms: [
          'Small water-soaked spots on leaves that turn brown with a yellow halo.',
          'Raised scabby lesions on the fruit that make it unmarketable.',
          'Leaf drop leaving fruit exposed to sunscald.',
        ],
        causes: [
          'Seed-borne bacteria and infected transplants.',
          'Splashing water and handling wet plants, which move bacteria plant to plant.',
        ],
        prevention: [
          'Use certified disease-free seed, or treat seed in hot water at 50 °C for 25 minutes.',
          'Rotate away from peppers and tomatoes for at least two years.',
          'Never work in the field while the foliage is wet.',
        ],
        organic_treatment: [
          'Spray copper oxychloride @ 3 g/litre on a 7-10 day schedule.',
          'Add a Bacillus subtilis biocontrol to the spray programme.',
        ],
        chemical_treatment: [
          'Apply copper hydroxide 53.8% DF @ 2 g/litre tank-mixed with Mancozeb.',
          'Add Streptomycin sulphate @ 0.5 g/litre where local guidance permits.',
        ],
      },
      ta: {
        disease_name: 'குடைமிளகாய் பாக்டீரியா புள்ளி நோய்',
        symptoms: ['இலைகளில் நீர் ஊறிய புள்ளிகள், பின் மஞ்சள் வளையத்துடன் பழுப்பாகும்.'],
        causes: ['விதை மூலம் பரவும் பாக்டீரியா மற்றும் பாதிக்கப்பட்ட நாற்றுகள்.'],
        prevention: ['நோயற்ற விதைகளைப் பயன்படுத்தவும்; இரண்டு ஆண்டு பயிர் சுழற்சி.'],
        organic_treatment: ['தாமிர ஆக்சிகுளோரைடு @ 3 கிராம்/லிட்டர் தெளிக்கவும்.'],
        chemical_treatment: ['காப்பர் ஹைட்ராக்சைடு @ 2 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'शिमला मिर्च जीवाणु धब्बा',
        symptoms: ['पत्तियों पर जल-सिक्त धब्बे जो पीले घेरे के साथ भूरे हो जाते हैं।'],
        causes: ['बीजजनित जीवाणु और संक्रमित पौध।'],
        prevention: ['रोगमुक्त बीज लें; दो साल का फसल चक्र अपनाएँ।'],
        organic_treatment: ['कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर छिड़कें।'],
        chemical_treatment: ['कॉपर हाइड्रॉक्साइड @ 2 ग्राम/लीटर छिड़कें।'],
      },
    },
  },

  /* --------------------------------------------------------------- Squash */
  {
    slug: 'squash_powdery_mildew',
    scientific_name: 'Podosphaera xanthii',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'squash', primary: true }],
    translations: {
      en: {
        disease_name: 'Squash Powdery Mildew',
        symptoms: [
          'White talcum-like patches on the upper leaf surface and stems.',
          'Leaves yellowing, then browning and turning brittle.',
          'Reduced fruit size and sunscald once the canopy dies back.',
        ],
        causes: [
          'Airborne spores that infect without needing free water on the leaf.',
          'Warm dry days with humid nights and a dense shaded canopy.',
        ],
        prevention: [
          'Space plants for airflow and train vines to reduce overlap.',
          'Grow resistant varieties where powdery mildew is a recurring problem.',
          'Scout the shaded lower leaves, where it always starts.',
        ],
        organic_treatment: [
          'Spray potassium bicarbonate @ 5 g/litre with a spreader at first sign.',
          'Apply neem oil @ 5 ml/litre every 7 days, covering the leaf undersides.',
        ],
        chemical_treatment: [
          'Apply wettable sulphur 80% WP @ 2 g/litre, avoiding application above 32 °C.',
          'Alternate with Hexaconazole 5% EC @ 2 ml/litre to limit resistance.',
        ],
      },
      ta: {
        disease_name: 'பூசணி சாம்பல் நோய்',
        symptoms: ['இலையின் மேற்பரப்பில் வெண்மையான பொடி போன்ற திட்டுகள்.'],
        causes: ['காற்றின் மூலம் பரவும் வித்திகள்; அடர்த்தியான நிழலான பயிர்.'],
        prevention: ['செடிகளுக்கு இடைவெளி விட்டு காற்றோட்டத்தை உறுதி செய்யவும்.'],
        organic_treatment: ['வேப்ப எண்ணெய் @ 5 மிலி/லிட்டர் 7 நாட்களுக்கு ஒருமுறை.'],
        chemical_treatment: ['நனையும் கந்தகம் 80% WP @ 2 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'कद्दू चूर्णिल आसिता',
        symptoms: ['पत्ती की ऊपरी सतह पर सफेद पाउडर जैसे धब्बे।'],
        causes: ['हवा से फैलने वाले बीजाणु; घना छायादार छत्र।'],
        prevention: ['पौधों के बीच दूरी रखें ताकि हवा चले।'],
        organic_treatment: ['नीम तेल @ 5 मिली/लीटर हर 7 दिन में छिड़कें।'],
        chemical_treatment: ['घुलनशील गंधक 80% WP @ 2 ग्राम/लीटर छिड़कें।'],
      },
    },
  },

  /* ----------------------------------------------------------- Strawberry */
  {
    slug: 'strawberry_leaf_scorch',
    scientific_name: 'Diplocarpon earlianum',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'strawberry', primary: true }],
    translations: {
      en: {
        disease_name: 'Strawberry Leaf Scorch',
        symptoms: [
          'Numerous small dark purple spots that stay purple rather than developing grey centres.',
          'Spots merging until the leaf looks scorched and dries at the margins.',
          'Weakened crowns producing fewer runners and smaller berries.',
        ],
        causes: [
          'Fungus overwintering on infected leaves left in the bed.',
          'Warm humid weather with overhead irrigation keeping leaves wet.',
        ],
        prevention: [
          'Remove old infected foliage after harvest renovation.',
          'Use drip irrigation and plastic mulch to keep foliage dry and reduce splash.',
          'Plant on raised beds with good spacing for airflow.',
        ],
        organic_treatment: [
          'Apply a copper-based fungicide immediately after renovation.',
          'Spray Bacillus subtilis formulations during humid spells.',
        ],
        chemical_treatment: [
          'Apply Captan 50% WP @ 2 g/litre on a 10-day schedule in wet weather.',
          'Alternate with Myclobutanil 10% WP @ 1 g/litre.',
        ],
      },
      ta: {
        disease_name: 'ஸ்ட்ராபெர்ரி இலைக்கருகல் நோய்',
        symptoms: ['ஏராளமான சிறிய அடர் ஊதா புள்ளிகள்; இலை கருகியது போல் தோன்றும்.'],
        causes: ['பாதிக்கப்பட்ட பழைய இலைகளில் தங்கும் பூஞ்சை.'],
        prevention: ['அறுவடைக்குப் பின் பழைய இலைகளை அகற்றவும்; சொட்டு நீர்ப்பாசனம்.'],
        organic_treatment: ['தாமிர அடிப்படையிலான பூஞ்சைக்கொல்லியைத் தெளிக்கவும்.'],
        chemical_treatment: ['கேப்டான் 50% WP @ 2 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'स्ट्रॉबेरी लीफ स्कॉर्च',
        symptoms: ['कई छोटे गहरे बैंगनी धब्बे; पत्ती झुलसी हुई दिखती है।'],
        causes: ['क्यारी में पड़ी संक्रमित पुरानी पत्तियों में जीवित कवक।'],
        prevention: ['कटाई के बाद पुरानी पत्तियाँ हटाएँ; ड्रिप सिंचाई अपनाएँ।'],
        organic_treatment: ['कॉपर आधारित कवकनाशी छिड़कें।'],
        chemical_treatment: ['कैप्टान 50% WP @ 2 ग्राम/लीटर छिड़कें।'],
      },
    },
  },

  /* --------------------------------------------------------------- Potato */
  {
    slug: 'potato_early_blight',
    scientific_name: 'Alternaria solani',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'potato', primary: true }],
    translations: {
      en: {
        disease_name: 'Potato Early Blight',
        symptoms: [
          'Dark brown spots with concentric target rings on the oldest leaves first.',
          'Yellow tissue surrounding each lesion, spreading until the leaf dies.',
          'Shallow dark sunken lesions on tubers with a raised border.',
        ],
        causes: [
          'Fungus surviving in soil, plant debris and volunteer potatoes.',
          'Alternating wet and dry periods with warm temperatures, especially on stressed crops.',
        ],
        prevention: [
          'Rotate for three years with non-solanaceous crops.',
          'Maintain adequate nitrogen; the disease hits nutrient-stressed plants hardest.',
          'Destroy volunteer potato plants and cull piles.',
        ],
        organic_treatment: [
          'Spray neem oil @ 5 ml/litre every 7 days from first symptoms.',
          'Apply a copper-based bio-fungicide before the canopy closes.',
        ],
        chemical_treatment: [
          'Apply Mancozeb 75% WP @ 2.5 g/litre at 7-10 day intervals.',
          'Alternate with Azoxystrobin 23% SC @ 1 ml/litre for resistance management.',
        ],
      },
      ta: {
        disease_name: 'உருளைக்கிழங்கு முன் இலைக்கருகல்',
        symptoms: ['பழைய இலைகளில் வளையம் போன்ற அடர் பழுப்பு புள்ளிகள்.'],
        causes: ['மண் மற்றும் பயிர்க் கழிவுகளில் தங்கும் பூஞ்சை.'],
        prevention: ['மூன்று ஆண்டு பயிர் சுழற்சியைப் பின்பற்றவும்.'],
        organic_treatment: ['வேப்ப எண்ணெய் @ 5 மிலி/லிட்டர் 7 நாட்களுக்கு ஒருமுறை.'],
        chemical_treatment: ['மான்கோசெப் 75% WP @ 2.5 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'आलू अगेती अंगमारी',
        symptoms: ['पुरानी पत्तियों पर छल्लेदार गहरे भूरे धब्बे।'],
        causes: ['मिट्टी और फसल अवशेषों में जीवित कवक।'],
        prevention: ['तीन साल का फसल चक्र अपनाएँ।'],
        organic_treatment: ['नीम तेल @ 5 मिली/लीटर हर 7 दिन छिड़कें।'],
        chemical_treatment: ['मैंकोजेब 75% WP @ 2.5 ग्राम/लीटर छिड़कें।'],
      },
    },
  },

  /* --------------------------------------------------------------- Tomato */
  {
    slug: 'tomato_bacterial_spot',
    scientific_name: 'Xanthomonas campestris pv. vesicatoria',
    severity: 'high',
    pathogen_type: 'bacterial',
    contagious: true,
    hosts: [{ crop: 'tomato', primary: true }],
    translations: {
      en: {
        disease_name: 'Tomato Bacterial Spot',
        symptoms: [
          'Small dark greasy-looking spots on leaves, often with a yellow margin.',
          'Raised scabby spots on green fruit that crack open.',
          'Rapid defoliation in hot wet weather.',
        ],
        causes: [
          'Seed-borne and transplant-borne bacteria.',
          'Warm temperatures above 24 °C with splashing rain or overhead irrigation.',
        ],
        prevention: [
          'Use certified clean seed and hot-water treat seed before sowing.',
          'Avoid overhead irrigation; drip keeps the foliage dry.',
          'Rotate away from tomato and pepper for two years.',
        ],
        organic_treatment: [
          'Spray copper oxychloride @ 3 g/litre every 7-10 days in wet weather.',
          'Include Bacillus subtilis as a preventive biocontrol.',
        ],
        chemical_treatment: [
          'Apply copper hydroxide @ 2 g/litre tank-mixed with Mancozeb 75% WP.',
          'Remove and destroy severely infected plants; no spray cures bacterial infection.',
        ],
      },
      ta: {
        disease_name: 'தக்காளி பாக்டீரியா புள்ளி நோய்',
        symptoms: ['இலைகளில் சிறிய அடர் எண்ணெய் தோற்ற புள்ளிகள், மஞ்சள் விளிம்புடன்.'],
        causes: ['விதை மற்றும் நாற்று மூலம் பரவும் பாக்டீரியா.'],
        prevention: ['சுத்தமான விதைகளைப் பயன்படுத்தவும்; மேல் நீர்ப்பாசனத்தைத் தவிர்க்கவும்.'],
        organic_treatment: ['தாமிர ஆக்சிகுளோரைடு @ 3 கிராம்/லிட்டர் தெளிக்கவும்.'],
        chemical_treatment: ['காப்பர் ஹைட்ராக்சைடு @ 2 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'टमाटर जीवाणु धब्बा',
        symptoms: ['पत्तियों पर छोटे गहरे चिकने धब्बे, अक्सर पीले किनारे के साथ।'],
        causes: ['बीज और पौध से फैलने वाले जीवाणु।'],
        prevention: ['स्वच्छ बीज लें; ऊपर से सिंचाई न करें।'],
        organic_treatment: ['कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर छिड़कें।'],
        chemical_treatment: ['कॉपर हाइड्रॉक्साइड @ 2 ग्राम/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'tomato_late_blight',
    scientific_name: 'Phytophthora infestans',
    severity: 'severe',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'tomato', primary: true }],
    translations: {
      en: {
        disease_name: 'Tomato Late Blight',
        symptoms: [
          'Large water-soaked grey-green patches on leaves that turn brown within days.',
          'White fuzzy growth on the leaf underside in humid mornings.',
          'Firm brown greasy lesions on green fruit; the crop can collapse in under a week.',
        ],
        causes: [
          'Oomycete spores carried on wind and rain from nearby infected potato or tomato.',
          'Cool nights near 15 °C with humidity above 90%.',
        ],
        prevention: [
          'Scout daily in cool wet weather; this disease moves faster than any other.',
          'Destroy infected plants immediately rather than trying to save them.',
          'Avoid planting tomato next to potato, which shares the pathogen.',
        ],
        organic_treatment: [
          'Apply copper oxychloride @ 3 g/litre preventively before wet spells.',
          'Remove and burn affected plants; organic sprays cannot stop an active epidemic.',
        ],
        chemical_treatment: [
          'Apply Metalaxyl 8% + Mancozeb 64% WP @ 2.5 g/litre at first sign.',
          'Follow with Cymoxanil 8% + Mancozeb 64% WP @ 3 g/litre after 7 days.',
        ],
      },
      ta: {
        disease_name: 'தக்காளி பின் இலைக்கருகல்',
        symptoms: ['இலைகளில் பெரிய நீர் ஊறிய சாம்பல்-பச்சை திட்டுகள், விரைவில் பழுப்பாகும்.'],
        causes: ['காற்று மற்றும் மழையால் பரவும் நோய்க்கிருமி; குளிர்ந்த ஈரமான காலநிலை.'],
        prevention: ['ஈரமான காலநிலையில் தினமும் கண்காணிக்கவும்; பாதித்த செடிகளை உடனே அழிக்கவும்.'],
        organic_treatment: ['தாமிர ஆக்சிகுளோரைடு @ 3 கிராம்/லிட்டர் முன்கூட்டியே தெளிக்கவும்.'],
        chemical_treatment: ['மெட்டாலாக்சில் + மான்கோசெப் @ 2.5 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'टमाटर पछेती अंगमारी',
        symptoms: ['पत्तियों पर बड़े जल-सिक्त भूरे-हरे धब्बे जो जल्दी भूरे हो जाते हैं।'],
        causes: ['हवा और बारिश से फैलने वाला रोगजनक; ठंडा नम मौसम।'],
        prevention: ['नम मौसम में रोज़ निगरानी करें; संक्रमित पौधे तुरंत नष्ट करें।'],
        organic_treatment: ['कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर पहले से छिड़कें।'],
        chemical_treatment: ['मेटालैक्सिल + मैंकोजेब @ 2.5 ग्राम/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'tomato_leaf_mold',
    scientific_name: 'Passalora fulva',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'tomato', primary: true }],
    translations: {
      en: {
        disease_name: 'Tomato Leaf Mold',
        symptoms: [
          'Pale green to yellow patches on the upper leaf surface with no clear border.',
          'Olive-green to brown velvety mould directly beneath those patches.',
          'Older leaves withering and dropping, mostly a greenhouse or polyhouse problem.',
        ],
        causes: [
          'High humidity above 85% with poor air circulation.',
          'Spores surviving on crop debris and greenhouse structures between crops.',
        ],
        prevention: [
          'Ventilate polyhouses aggressively and heat at night to prevent condensation.',
          'Space and prune plants to move air through the canopy.',
          'Sanitise structures and remove all debris between crops.',
        ],
        organic_treatment: [
          'Reduce humidity first; sprays alone rarely control it in a closed house.',
          'Apply a copper-based fungicide on a preventive schedule.',
        ],
        chemical_treatment: [
          'Apply Chlorothalonil 75% WP @ 2 g/litre.',
          'Alternate with Difenoconazole 25% EC @ 0.5 ml/litre.',
        ],
      },
      ta: {
        disease_name: 'தக்காளி இலைப் பூஞ்சை நோய்',
        symptoms: ['இலையின் மேற்பரப்பில் மங்கிய மஞ்சள் திட்டுகள்; கீழே ஆலிவ் நிற பூஞ்சை.'],
        causes: ['85%க்கு மேல் ஈரப்பதம் மற்றும் மோசமான காற்றோட்டம்.'],
        prevention: ['பசுமைக் குடிலில் காற்றோட்டத்தை அதிகரிக்கவும்.'],
        organic_treatment: ['முதலில் ஈரப்பதத்தைக் குறைக்கவும்; தாமிர மருந்து தெளிக்கவும்.'],
        chemical_treatment: ['குளோரோதலோனில் 75% WP @ 2 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'टमाटर पत्ती मोल्ड',
        symptoms: ['ऊपरी सतह पर हल्के पीले धब्बे; नीचे जैतूनी मखमली फफूंद।'],
        causes: ['85% से अधिक आर्द्रता और खराब वायु संचार।'],
        prevention: ['पॉलीहाउस में वायु संचार बढ़ाएँ।'],
        organic_treatment: ['पहले आर्द्रता घटाएँ; कॉपर कवकनाशी छिड़कें।'],
        chemical_treatment: ['क्लोरोथैलोनिल 75% WP @ 2 ग्राम/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'tomato_septoria_leaf_spot',
    scientific_name: 'Septoria lycopersici',
    severity: 'high',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'tomato', primary: true }],
    translations: {
      en: {
        disease_name: 'Tomato Septoria Leaf Spot',
        symptoms: [
          'Many small circular spots with grey centres and dark brown margins.',
          'Tiny black specks (fruiting bodies) visible in the centre of each spot.',
          'Severe defoliation from the bottom up, exposing fruit to sunscald.',
        ],
        causes: [
          'Fungus overwintering on infected debris and solanaceous weeds.',
          'Warm wet conditions with splashing water spreading spores upward.',
        ],
        prevention: [
          'Mulch to stop soil splash reaching the lowest leaves.',
          'Remove the lowest leaves once plants establish, and destroy crop debris.',
          'Control nightshade weeds around the field, which host the fungus.',
        ],
        organic_treatment: [
          'Spray copper oxychloride @ 3 g/litre at first spots, covering lower leaves.',
          'Apply neem oil weekly as part of a preventive rotation.',
        ],
        chemical_treatment: [
          'Apply Chlorothalonil 75% WP @ 2 g/litre every 7-10 days.',
          'Alternate with Mancozeb 75% WP @ 2.5 g/litre.',
        ],
      },
      ta: {
        disease_name: 'தக்காளி செப்டோரியா இலைப்புள்ளி',
        symptoms: ['சாம்பல் நடுப்பகுதி மற்றும் அடர் பழுப்பு விளிம்புடன் பல சிறிய வட்டப் புள்ளிகள்.'],
        causes: ['பயிர்க் கழிவுகளில் தங்கும் பூஞ்சை; தெறிக்கும் நீரால் பரவல்.'],
        prevention: ['மூடாக்கு இட்டு மண் தெறிப்பதைத் தடுக்கவும்.'],
        organic_treatment: ['தாமிர ஆக்சிகுளோரைடு @ 3 கிராம்/லிட்டர் தெளிக்கவும்.'],
        chemical_treatment: ['குளோரோதலோனில் 75% WP @ 2 கிராம்/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'टमाटर सेप्टोरिया पत्ती धब्बा',
        symptoms: ['भूरे किनारों और स्लेटी केंद्र वाले कई छोटे गोल धब्बे।'],
        causes: ['फसल अवशेषों में जीवित कवक; पानी के छींटों से फैलाव।'],
        prevention: ['मल्च बिछाएँ ताकि मिट्टी के छींटे पत्तियों तक न पहुँचें।'],
        organic_treatment: ['कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर छिड़कें।'],
        chemical_treatment: ['क्लोरोथैलोनिल 75% WP @ 2 ग्राम/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'tomato_spider_mites',
    scientific_name: 'Tetranychus urticae',
    severity: 'moderate',
    pathogen_type: 'pest',
    contagious: true,
    hosts: [{ crop: 'tomato', primary: true }],
    translations: {
      en: {
        disease_name: 'Tomato Spider Mites (Two-Spotted)',
        symptoms: [
          'Fine pale stippling across the leaf as mites feed on individual cells.',
          'Delicate webbing on the leaf underside and between stems.',
          'Leaves turning bronze then dropping in heavy infestations.',
        ],
        causes: [
          'Hot dry dusty conditions, which let mite populations explode.',
          'Broad-spectrum insecticide use that kills the predatory mites keeping them in check.',
        ],
        prevention: [
          'Avoid unnecessary broad-spectrum insecticides that destroy natural predators.',
          'Keep plants well watered; drought-stressed plants are far more susceptible.',
          'Hose down dusty foliage along field edges and roadways.',
        ],
        organic_treatment: [
          'Spray neem oil @ 5 ml/litre or insecticidal soap, targeting leaf undersides.',
          'Release predatory mites such as Phytoseiulus persimilis.',
        ],
        chemical_treatment: [
          'Apply Spiromesifen 22.9% SC @ 1 ml/litre.',
          'Rotate with Abamectin 1.9% EC @ 0.5 ml/litre; mites develop resistance quickly.',
        ],
      },
      ta: {
        disease_name: 'தக்காளி சிலந்திப் பூச்சி',
        symptoms: ['இலைகளில் நுண்ணிய வெளிர் புள்ளிகள்; இலையின் அடிப்பகுதியில் வலை.'],
        causes: ['வெப்பமான வறண்ட தூசி நிறைந்த சூழல்.'],
        prevention: ['பரவலான பூச்சிக்கொல்லிகளைத் தவிர்க்கவும்; நீர் பற்றாக்குறை வேண்டாம்.'],
        organic_treatment: ['வேப்ப எண்ணெய் @ 5 மிலி/லிட்டர் இலையின் அடிப்பகுதியில் தெளிக்கவும்.'],
        chemical_treatment: ['ஸ்பைரோமெசிஃபென் 22.9% SC @ 1 மிலி/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'टमाटर मकड़ी माइट',
        symptoms: ['पत्तियों पर महीन पीले बिंदु; निचली सतह पर जाला।'],
        causes: ['गर्म, सूखी और धूल भरी परिस्थितियाँ।'],
        prevention: ['व्यापक कीटनाशकों से बचें; पौधों को पानी की कमी न हो।'],
        organic_treatment: ['नीम तेल @ 5 मिली/लीटर निचली सतह पर छिड़कें।'],
        chemical_treatment: ['स्पाइरोमेसिफेन 22.9% SC @ 1 मिली/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'tomato_target_spot',
    scientific_name: 'Corynespora cassiicola',
    severity: 'moderate',
    pathogen_type: 'fungal',
    contagious: true,
    hosts: [{ crop: 'tomato', primary: true }],
    translations: {
      en: {
        disease_name: 'Tomato Target Spot',
        symptoms: [
          'Small brown spots that enlarge into lesions with a distinct light centre and dark rings.',
          'Spots on stems and fruit as well as leaves, unlike most leaf spots.',
          'Pitted sunken lesions on fruit that open the way to soft rot.',
        ],
        causes: [
          'Fungus surviving on crop debris and alternative hosts.',
          'Warm humid weather with extended leaf wetness.',
        ],
        prevention: [
          'Remove and destroy crop residue promptly after harvest.',
          'Stake and prune for airflow so foliage dries early in the day.',
          'Rotate with non-host crops such as cereals.',
        ],
        organic_treatment: [
          'Apply copper-based fungicide preventively during humid periods.',
          'Improve canopy airflow, which limits the leaf wetness the fungus needs.',
        ],
        chemical_treatment: [
          'Apply Azoxystrobin 23% SC @ 1 ml/litre.',
          'Alternate with Mancozeb 75% WP @ 2.5 g/litre.',
        ],
      },
      ta: {
        disease_name: 'தக்காளி இலக்குப் புள்ளி நோய்',
        symptoms: ['வெளிர் நடுப்பகுதி மற்றும் அடர் வளையங்களுடன் பழுப்புப் புள்ளிகள்.'],
        causes: ['பயிர்க் கழிவுகளில் தங்கும் பூஞ்சை; ஈரமான வெப்பநிலை.'],
        prevention: ['அறுவடைக்குப் பின் கழிவுகளை உடனே அகற்றவும்.'],
        organic_treatment: ['ஈரமான காலங்களில் தாமிர மருந்தை முன்கூட்டியே தெளிக்கவும்.'],
        chemical_treatment: ['அசோக்சிஸ்ட்ரோபின் 23% SC @ 1 மிலி/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'टमाटर टारगेट स्पॉट',
        symptoms: ['हल्के केंद्र और गहरे छल्लों वाले भूरे धब्बे।'],
        causes: ['फसल अवशेषों में जीवित कवक; गर्म नम मौसम।'],
        prevention: ['कटाई के बाद अवशेष तुरंत हटाएँ।'],
        organic_treatment: ['नम मौसम में कॉपर कवकनाशी पहले से छिड़कें।'],
        chemical_treatment: ['एज़ोक्सिस्ट्रोबिन 23% SC @ 1 मिली/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'tomato_yellow_leaf_curl_virus',
    scientific_name: 'Tomato yellow leaf curl virus',
    severity: 'severe',
    pathogen_type: 'viral',
    contagious: true,
    hosts: [{ crop: 'tomato', primary: true }],
    translations: {
      en: {
        disease_name: 'Tomato Yellow Leaf Curl Virus',
        symptoms: [
          'Severe upward curling and cupping of leaves with yellow margins.',
          'Stunted bushy plants with shortened internodes.',
          'Heavy flower drop and almost no fruit set if infected when young.',
        ],
        causes: [
          'Virus transmitted by the whitefly Bemisia tabaci.',
          'Infected transplants or a nearby infected crop acting as a reservoir.',
        ],
        prevention: [
          'Raise seedlings under 50-mesh insect-proof net.',
          'Use yellow sticky traps and control whitefly from nursery stage onward.',
          'Rogue out infected plants immediately; there is no cure once infected.',
        ],
        organic_treatment: [
          'Spray neem oil @ 5 ml/litre to deter whitefly.',
          'Install yellow sticky traps at 10-12 per acre and plant maize as a border barrier.',
        ],
        chemical_treatment: [
          'Control the vector with Imidacloprid 17.8% SL @ 0.3 ml/litre.',
          'Rotate with Diafenthiuron 50% WP @ 1 g/litre; no spray cures the virus itself.',
        ],
      },
      ta: {
        disease_name: 'தக்காளி மஞ்சள் இலைச் சுருள் வைரஸ்',
        symptoms: ['இலைகள் மேல்நோக்கி சுருண்டு மஞ்சள் விளிம்பு; செடி குள்ளமாகும்.'],
        causes: ['வெள்ளை ஈயால் பரவும் வைரஸ்.'],
        prevention: ['நாற்றுகளை பூச்சி எதிர்ப்பு வலையின் கீழ் வளர்க்கவும்.'],
        organic_treatment: ['வேப்ப எண்ணெய் தெளிக்கவும்; மஞ்சள் ஒட்டும் பொறிகளை வைக்கவும்.'],
        chemical_treatment: ['இமிடாகுளோபிரிட் 17.8% SL @ 0.3 மிலி/லிட்டர் தெளிக்கவும்.'],
      },
      hi: {
        disease_name: 'टमाटर पीला पत्ती मरोड़ विषाणु',
        symptoms: ['पत्तियाँ ऊपर की ओर मुड़ती हैं, पीले किनारे; पौधा बौना रह जाता है।'],
        causes: ['सफेद मक्खी द्वारा फैलने वाला विषाणु।'],
        prevention: ['पौध को कीटरोधी जाली के नीचे तैयार करें।'],
        organic_treatment: ['नीम तेल छिड़कें; पीले चिपचिपे ट्रैप लगाएँ।'],
        chemical_treatment: ['इमिडाक्लोप्रिड 17.8% SL @ 0.3 मिली/लीटर छिड़कें।'],
      },
    },
  },
  {
    slug: 'tomato_mosaic_virus',
    scientific_name: 'Tomato mosaic virus',
    severity: 'high',
    pathogen_type: 'viral',
    contagious: true,
    hosts: [{ crop: 'tomato', primary: true }],
    translations: {
      en: {
        disease_name: 'Tomato Mosaic Virus',
        symptoms: [
          'Light and dark green mottling across the leaf, giving a mosaic pattern.',
          'Fern-like narrowing and distortion of young leaves.',
          'Internal browning of fruit and uneven ripening.',
        ],
        causes: [
          'An extremely stable virus spread by handling, tools and contaminated seed.',
          'Tobacco products on the hands of workers, which can carry related tobamoviruses.',
        ],
        prevention: [
          'Wash hands and disinfect tools with skimmed milk or trisodium phosphate between plants.',
          'Use resistant varieties carrying the Tm-2a gene.',
          'Prohibit smoking and tobacco handling in the field and nursery.',
        ],
        organic_treatment: [
          'Remove and destroy infected plants; no spray affects a virus.',
          'Disinfect stakes, trays and tools before reuse, as the virus survives for years.',
        ],
        chemical_treatment: [
          'No chemical controls a plant virus directly.',
          'Focus on sanitation and resistant cultivars rather than sprays.',
        ],
      },
      ta: {
        disease_name: 'தக்காளி மொசைக் வைரஸ்',
        symptoms: ['இலைகளில் வெளிர் மற்றும் அடர் பச்சை கலவை; இளம் இலைகள் குறுகும்.'],
        causes: ['கை, கருவிகள் மற்றும் விதைகள் வழியாக பரவும் நிலையான வைரஸ்.'],
        prevention: ['கைகளைக் கழுவி கருவிகளைக் கிருமி நீக்கம் செய்யவும்; தடுப்பு ரகங்கள்.'],
        organic_treatment: ['பாதிக்கப்பட்ட செடிகளை அகற்றி அழிக்கவும்.'],
        chemical_treatment: ['வைரஸுக்கு வேதியியல் மருந்து இல்லை; சுகாதாரமே தீர்வு.'],
      },
      hi: {
        disease_name: 'टमाटर मोज़ेक विषाणु',
        symptoms: ['पत्तियों पर हल्के-गहरे हरे धब्बों का मोज़ेक; नई पत्तियाँ सिकुड़ी।'],
        causes: ['हाथों, औज़ारों और बीज से फैलने वाला अत्यंत स्थिर विषाणु।'],
        prevention: ['हाथ धोएँ, औज़ार कीटाणुरहित करें; प्रतिरोधी किस्में लगाएँ।'],
        organic_treatment: ['संक्रमित पौधे हटाकर नष्ट करें।'],
        chemical_treatment: ['विषाणु के लिए कोई रसायन नहीं; स्वच्छता ही उपाय है।'],
      },
    },
  },
];
