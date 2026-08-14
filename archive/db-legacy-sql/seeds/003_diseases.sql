-- 003_diseases.sql
-- Sample diseases with translations and crop associations.
-- Content mirrors the application's disease catalogue.
--
-- Idempotent: keyed on `slug`, safe to re-run.

-- ---------------------------------------------------------------------------
-- diseases
-- ---------------------------------------------------------------------------
INSERT INTO diseases (slug, scientific_name, severity, pathogen_type, contagious) VALUES
  ('tomato_early_blight', 'Alternaria solani',   'moderate', 'fungal', TRUE),
  ('rice_leaf_blast',     'Magnaporthe oryzae',  'high',     'fungal', TRUE),
  ('late_blight',         'Phytophthora infestans', 'severe', 'fungal', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- crop_diseases
--
-- Late blight is deliberately attached to BOTH potato and tomato: it is the
-- clearest example of why this relationship cannot be a single crop_id column
-- on diseases.
-- ---------------------------------------------------------------------------
INSERT INTO crop_diseases (crop_id, disease_id, is_primary_host, severity_override)
SELECT c.id, d.id, x.is_primary_host, x.severity_override::disease_severity
FROM (VALUES
  ('tomato', 'tomato_early_blight', TRUE,  NULL),
  ('rice',   'rice_leaf_blast',     TRUE,  NULL),
  ('potato', 'late_blight',         TRUE,  'severe'),
  ('tomato', 'late_blight',         FALSE, 'high')
) AS x(crop_slug, disease_slug, is_primary_host, severity_override)
JOIN crops c    ON c.slug = x.crop_slug
JOIN diseases d ON d.slug = x.disease_slug
ON CONFLICT (crop_id, disease_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- disease_translations
--
-- English carries the full agronomic detail; the other languages carry the
-- name and overview. Remaining list content is populated by the translation
-- pipeline described in docs/database-design.md.
-- ---------------------------------------------------------------------------
INSERT INTO disease_translations (
  disease_id, language_code, disease_name, overview,
  symptoms, causes, favorable_conditions,
  prevention, immediate_steps, organic_treatment, chemical_treatment, disclaimer
)
SELECT
  d.id, t.language_code, t.disease_name, t.overview,
  t.symptoms, t.causes, t.favorable_conditions,
  t.prevention, t.immediate_steps, t.organic_treatment, t.chemical_treatment, t.disclaimer
FROM (VALUES
  (
    'tomato_early_blight', 'en', 'Tomato Early Blight',
    'Early blight is a common fungal disease of tomatoes caused by Alternaria solani. It causes concentric ring dark brown spots on older leaves, lower leaf yellowing, and foliage loss.',
    ARRAY[
      'Concentric dark brown circular spots with target-like rings on mature bottom leaves.',
      'Yellowing halo around dark foliage spots.',
      'Premature defoliation starting from the lower stem working upwards.',
      'Sunscald damage on fruit due to canopy leaf drop.'
    ],
    ARRAY[
      'Fungal spores (Alternaria solani) surviving in plant debris or soil over winter.',
      'Warm temperature combined with frequent leaf wetness or high humidity.',
      'Rain splash or overhead irrigation carrying spores to bottom leaves.'
    ],
    ARRAY[
      'Temperatures between 24 °C and 29 °C.',
      'High humidity (>80%) or frequent evening rains.',
      'Dense plant spacing with poor airflow.'
    ],
    ARRAY[
      'Practice 3-year crop rotation with non-solanaceous crops like maize or beans.',
      'Maintain 60 cm spacing between plants for adequate sunlight and ventilation.',
      'Destroy crop residue immediately after harvest.'
    ],
    ARRAY[
      'Prune off heavily infected lower leaves and discard them away from the field.',
      'Avoid overhead sprinklers — water only at the soil base around roots.',
      'Mulch the soil surface with straw to stop spores splashing up from the soil.'
    ],
    ARRAY[
      'Spray neem oil extract (5 ml per litre of water) every 7 days as an organic fungicide.',
      'Apply a copper-based bio-fungicide spray early in the morning.',
      'Spray Trichoderma viride bio-agent formulation (5 g/L).'
    ],
    ARRAY[
      'Apply Mancozeb 75% WP @ 2.5 g/litre of water.',
      'Alternate with Chlorothalonil 75% WP @ 2 g/litre for resistance management.'
    ],
    'Always follow local agricultural extension guidelines and official pesticide label instructions before chemical applications.'
  ),
  (
    'tomato_early_blight', 'ta', 'தக்காளி இலைக்கருகல் நோய் (Early Blight)',
    'Alternaria solani பூஞ்சையால் ஏற்படும் பொதுவான தக்காளி நோய். பழைய இலைகளில் வளையம் போன்ற அடர் பழுப்பு புள்ளிகள் தோன்றி, இலைகள் மஞ்சளாகி உதிர்கின்றன.',
    '{}', '{}', '{}', '{}', '{}', '{}', '{}',
    'ரசாயனங்களைப் பயன்படுத்தும் முன் உள்ளூர் வேளாண் அலுவலர் வழிகாட்டுதலையும் லேபிள் அறிவுறுத்தல்களையும் பின்பற்றவும்.'
  ),
  (
    'tomato_early_blight', 'hi', 'टमाटर अगेती अंगमारी (Early Blight)',
    'Alternaria solani कवक से होने वाला टमाटर का सामान्य रोग। पुरानी पत्तियों पर गोल छल्लेदार गहरे भूरे धब्बे बनते हैं और पत्तियाँ पीली होकर गिर जाती हैं।',
    '{}', '{}', '{}', '{}', '{}', '{}', '{}',
    'रासायनिक छिड़काव से पहले स्थानीय कृषि विभाग के दिशानिर्देश और लेबल निर्देश अवश्य पढ़ें।'
  ),
  (
    'rice_leaf_blast', 'en', 'Rice Leaf Blast',
    'Rice blast is one of the most destructive fungal diseases affecting paddy fields. Spindle-shaped lesions with reddish-brown borders appear on leaves, causing plant stunting and panicle blast.',
    ARRAY[
      'Spindle-shaped or diamond-shaped spots with grey-white centres and dark brown margins.',
      'Drying and burning appearance of leaf tips across the field.',
      'Rotting and breaking of panicle nodes (neck blast).'
    ],
    ARRAY[
      'Wind-borne fungal spores spreading rapidly in foggy morning conditions.',
      'Excessive nitrogenous fertilizer applications.',
      'Low soil moisture coupled with night dew drops.'
    ],
    ARRAY[
      'Prolonged leaf wetness with night temperatures near 20 °C.',
      'Dense canopy from heavy nitrogen use.'
    ],
    ARRAY[
      'Use blast-resistant certified rice seeds.',
      'Maintain a balanced NPK fertilizer ratio and avoid over-dosing nitrogen.'
    ],
    ARRAY[
      'Drain standing water from the paddy field temporarily if flooded.',
      'Suspend nitrogen fertilizer top-dressing immediately.',
      'Collect and destroy infected stubble.'
    ],
    ARRAY[
      'Spray Pseudomonas fluorescens (10 g/L) at first symptom.',
      'Apply neem-based formulations at weekly intervals.'
    ],
    ARRAY[
      'Apply Tricyclazole 75% WP @ 0.6 g/litre of water.',
      'Alternate with Isoprothiolane 40% EC as per label rates.'
    ],
    'Always consult your local Krishi Vigyan Kendra or agriculture department officer for field recommendations.'
  ),
  (
    'rice_leaf_blast', 'ta', 'நெல் குலை நோய் (Leaf Blast)',
    'நெல் வயல்களைப் பாதிக்கும் மிகவும் அழிவுகரமான பூஞ்சை நோய்களில் ஒன்று. இலைகளில் சிவப்பு-பழுப்பு விளிம்புகளுடன் கூரான புள்ளிகள் தோன்றும்.',
    '{}', '{}', '{}', '{}', '{}', '{}', '{}',
    'வயல் பரிந்துரைகளுக்கு உள்ளூர் கிருஷி விஞ்ஞான் கேந்திரா அலுவலரை அணுகவும்.'
  ),
  (
    'late_blight', 'en', 'Late Blight',
    'Late blight is a water mould disease affecting potato and tomato. It spreads explosively in cool, wet weather and can destroy a field within days.',
    ARRAY[
      'Dark, water-soaked lesions on leaves with a pale green halo.',
      'White fuzzy growth on the underside of leaves in humid conditions.',
      'Firm brown rot on tubers and fruit.'
    ],
    ARRAY[
      'Phytophthora infestans spores spread by wind and rain.',
      'Infected seed tubers or volunteer plants carrying the pathogen over.'
    ],
    ARRAY[
      'Cool temperatures of 10-20 °C with prolonged leaf wetness.',
      'Consecutive days of rain or heavy dew.'
    ],
    ARRAY[
      'Plant certified disease-free seed tubers.',
      'Destroy volunteer plants and cull piles before the season.',
      'Hill soil well over developing tubers.'
    ],
    ARRAY[
      'Remove and destroy infected plants immediately — do not compost them.',
      'Stop overhead irrigation until the canopy dries.'
    ],
    ARRAY[
      'Apply copper oxychloride formulations preventively before rain events.'
    ],
    ARRAY[
      'Apply Metalaxyl + Mancozeb @ 2.5 g/litre at first report in the district.'
    ],
    'Late blight is a notifiable outbreak risk in many districts. Report suspected cases to your local agriculture office.'
  )
) AS t(
  disease_slug, language_code, disease_name, overview,
  symptoms, causes, favorable_conditions,
  prevention, immediate_steps, organic_treatment, chemical_treatment, disclaimer
)
JOIN diseases d ON d.slug = t.disease_slug
ON CONFLICT (disease_id, language_code) DO UPDATE
  SET disease_name = EXCLUDED.disease_name,
      overview     = EXCLUDED.overview;
