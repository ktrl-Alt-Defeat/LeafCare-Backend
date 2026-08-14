-- 002_crops.sql
-- Sample crops with full agronomy, translations in all six languages, seasons
-- and companion relationships. Values are taken from the application's crop
-- catalogue so the seeded database matches what the UI already renders.
--
-- Idempotent: keyed on `slug`, safe to re-run.

-- ---------------------------------------------------------------------------
-- crops
-- ---------------------------------------------------------------------------
INSERT INTO crops (
  slug, scientific_name, water_requirement, sunlight,
  temperature_min_c, temperature_max_c, rainfall_min_mm, rainfall_max_mm,
  humidity_min_pct, humidity_max_pct,
  soil_type, ph_min, ph_max, drainage,
  life_cycle, labour_level, planting_method,
  row_spacing_min_cm, row_spacing_max_cm, plant_spacing_min_cm, plant_spacing_max_cm,
  nutrient_unit, nitrogen_requirement, phosphorus_requirement, potassium_requirement
) VALUES
  ('rice', 'Oryza sativa', 'high', 'full_sun',
   20, 35, 1000, 2000, NULL, NULL,
   'Clay loam, alluvial', 5.5, 7.0, NULL,
   'annual', 'high', 'Transplanting / direct seeding',
   20, 25, 15, 20,
   'kg_per_hectare', 100, 40, 40),

  ('tomato', 'Solanum lycopersicum', 'high', 'full_sun',
   18, 30, 600, 1200, NULL, NULL,
   'Fertile loam', 5.5, 7.0, NULL,
   'annual', 'high', 'Transplanted',
   60, 90, 45, 60,
   'kg_per_hectare', 100, 60, 120),

  ('wheat', 'Triticum aestivum', 'moderate', 'full_sun',
   15, 25, 450, 650, NULL, NULL,
   'Loam, clay loam', 6.0, 7.5, NULL,
   'annual', 'medium', 'Direct seeding',
   15, 25, NULL, NULL,
   'kg_per_hectare', 120, 60, 40),

  ('potato', 'Solanum tuberosum', 'moderate', 'full_sun',
   15, 20, 500, 750, NULL, NULL,
   'Sandy loam', 5.0, 6.5, NULL,
   'annual', 'medium', 'Seed tubers',
   60, 75, 20, 30,
   'kg_per_hectare', 120, 80, 150),

  ('apple', 'Malus domestica', 'intermediate', 'full_sun',
   15, 24, 500, 1000, 50, 70,
   'Loamy, well-drained', 6.0, 7.0, 'good',
   'perennial', 'medium', 'Transplanted / grafted',
   400, 600, 300, 500,
   'g_per_plant', 200, 70, 250),

  ('blueberry', 'Vaccinium corymbosum', 'high', 'full_sun',
   15, 25, 700, 1200, 50, 70,
   'Acidic, sandy loam', 4.5, 5.5, NULL,
   'perennial', 'medium', 'Transplanted',
   250, 300, 100, 150,
   'kg_per_hectare', 50, 30, 50)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- crop_seasons
-- ---------------------------------------------------------------------------
INSERT INTO crop_seasons (crop_id, season)
SELECT c.id, s.season::crop_season
FROM (VALUES
  ('rice',      'kharif'),
  ('tomato',    'kharif'),
  ('tomato',    'rabi'),
  ('wheat',     'rabi'),
  ('potato',    'rabi'),
  ('apple',     'perennial'),
  ('blueberry', 'perennial')
) AS s(slug, season)
JOIN crops c ON c.slug = s.slug
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- crop_translations
-- ---------------------------------------------------------------------------
INSERT INTO crop_translations (crop_id, language_code, crop_name, description)
SELECT c.id, t.language_code, t.crop_name, t.description
FROM (VALUES
  -- Rice
  ('rice', 'en', 'Rice',        'Staple cereal grain grown widely in paddy fields.'),
  ('rice', 'ta', 'நெல்',         'நீர்ப்பாசன வயல்களில் பரவலாக பயிரிடப்படும் முக்கிய தானியப் பயிர்.'),
  ('rice', 'hi', 'चावल / धान',   'धान के खेतों में व्यापक रूप से उगाया जाने वाला मुख्य अनाज।'),
  ('rice', 'te', 'వరి',          'మాగాణి పొలాల్లో విస్తృతంగా పండించే ప్రధాన ధాన్యపు పంట.'),
  ('rice', 'ml', 'നെല്ല്',        'നെൽവയലുകളിൽ വ്യാപകമായി കൃഷി ചെയ്യുന്ന പ്രധാന ധാന്യവിള.'),
  ('rice', 'kn', 'ಅಕ್ಕಿ / ಭತ್ತ',  'ಗದ್ದೆಗಳಲ್ಲಿ ವ್ಯಾಪಕವಾಗಿ ಬೆಳೆಯುವ ಪ್ರಮುಖ ಧಾನ್ಯ ಬೆಳೆ.'),

  -- Tomato
  ('tomato', 'en', 'Tomato',    'High-value vegetable crop susceptible to blight and leaf spots.'),
  ('tomato', 'ta', 'தக்காளி',    'இலைக்கருகல் மற்றும் இலைப்புள்ளி நோய்களால் பாதிக்கப்படும் அதிக மதிப்புள்ள காய்கறிப் பயிர்.'),
  ('tomato', 'hi', 'टमाटर',      'अंगमारी और पत्ती धब्बा रोग के प्रति संवेदनशील उच्च मूल्य वाली सब्ज़ी फसल।'),
  ('tomato', 'te', 'టమోటా',      'ఆకుమచ్చ, ఎండు తెగుళ్లకు గురయ్యే అధిక విలువైన కూరగాయ పంట.'),
  ('tomato', 'ml', 'തക്കാളി',    'ഇലകരിച്ചിലിനും ഇലപ്പുള്ളിക്കും വിധേയമാകുന്ന ഉയർന്ന മൂല്യമുള്ള പച്ചക്കറി വിള.'),
  ('tomato', 'kn', 'ಟೊಮೆಟೊ',    'ಎಲೆ ಚುಕ್ಕೆ ಮತ್ತು ಅಂಗಮಾರಿ ರೋಗಕ್ಕೆ ತುತ್ತಾಗುವ ಹೆಚ್ಚು ಮೌಲ್ಯದ ತರಕಾರಿ ಬೆಳೆ.'),

  -- Wheat
  ('wheat', 'en', 'Wheat',      'Major food grain grown during the rabi season.'),
  ('wheat', 'ta', 'கோதுமை',      'ரபி பருவத்தில் பயிரிடப்படும் முக்கிய உணவு தானியம்.'),
  ('wheat', 'hi', 'गेहूं',        'रबी मौसम में उगाया जाने वाला प्रमुख खाद्यान्न।'),
  ('wheat', 'te', 'గోధుమ',       'రబీ కాలంలో పండించే ప్రధాన ఆహార ధాన్యం.'),
  ('wheat', 'ml', 'ഗോതമ്പ്',     'റബി സീസണിൽ കൃഷി ചെയ്യുന്ന പ്രധാന ഭക്ഷ്യധാന്യം.'),
  ('wheat', 'kn', 'ಗೋಧಿ',        'ರಬಿ ಋತುವಿನಲ್ಲಿ ಬೆಳೆಯುವ ಪ್ರಮುಖ ಆಹಾರ ಧಾನ್ಯ.'),

  -- Potato
  ('potato', 'en', 'Potato',    'Tuber crop prone to late blight and bacterial wilt.'),
  ('potato', 'ta', 'உருளைக்கிழங்கு', 'பிந்தைய கருகல் மற்றும் பாக்டீரியா வாடல் நோய்க்கு ஆளாகும் கிழங்குப் பயிர்.'),
  ('potato', 'hi', 'आलू',        'पछेती अंगमारी और जीवाणु उकठा रोग के प्रति संवेदनशील कंद फसल।'),
  ('potato', 'te', 'బంగాళాదుంప',  'ఆలస్య ఎండు తెగులు, బ్యాక్టీరియా వాడుకు గురయ్యే దుంప పంట.'),
  ('potato', 'ml', 'ഉരുളക്കിഴങ്ങ്', 'വൈകിയ ഇലകരിച്ചിലിനും ബാക്ടീരിയൽ വാട്ടത്തിനും വിധേയമാകുന്ന കിഴങ്ങുവിള.'),
  ('potato', 'kn', 'ಆಲೂಗಡ್ಡೆ',    'ತಡವಾದ ಅಂಗಮಾರಿ ಮತ್ತು ಬ್ಯಾಕ್ಟೀರಿಯಾ ಬಾಡುವಿಕೆಗೆ ತುತ್ತಾಗುವ ಗೆಡ್ಡೆ ಬೆಳೆ.'),

  -- Apple
  ('apple', 'en', 'Apple',      'Temperate fruit crop subject to scab and cedar rust.'),
  ('apple', 'ta', 'ஆப்பிள்',      'ஸ்கேப் மற்றும் துரு நோய்களுக்கு ஆளாகும் மிதவெப்ப மண்டல பழப் பயிர்.'),
  ('apple', 'hi', 'सेब',         'स्कैब और रस्ट रोग के प्रति संवेदनशील शीतोष्ण फल फसल।'),
  ('apple', 'te', 'ఆపిల్',        'స్కాబ్, తుప్పు తెగుళ్లకు గురయ్యే సమశీతోష్ణ పండ్ల పంట.'),
  ('apple', 'ml', 'ആപ്പിൾ',      'സ്കാബ്, തുരുമ്പ് രോഗങ്ങൾക്ക് വിധേയമാകുന്ന മിതശീതോഷ്ണ ഫലവിള.'),
  ('apple', 'kn', 'ಸೇಬು',        'ಸ್ಕ್ಯಾಬ್ ಮತ್ತು ತುಕ್ಕು ರೋಗಕ್ಕೆ ತುತ್ತಾಗುವ ಸಮಶೀತೋಷ್ಣ ಹಣ್ಣಿನ ಬೆಳೆ.'),

  -- Blueberry
  ('blueberry', 'en', 'Blueberry', 'Berry fruit prone to mummy berry and leaf spot.'),
  ('blueberry', 'ta', 'புளூபெர்ரி',  'மம்மி பெர்ரி மற்றும் இலைப்புள்ளி நோய்க்கு ஆளாகும் பெர்ரி பழம்.'),
  ('blueberry', 'hi', 'ब्लूबेरी',     'ममी बेरी और पत्ती धब्बा रोग के प्रति संवेदनशील बेरी फल।'),
  ('blueberry', 'te', 'బ్లూబెర్రీ',    'మమ్మీ బెర్రీ, ఆకుమచ్చ తెగుళ్లకు గురయ్యే బెర్రీ పండు.'),
  ('blueberry', 'ml', 'ബ്ലൂബെറി',    'മമ്മി ബെറി, ഇലപ്പുള്ളി രോഗങ്ങൾക്ക് വിധേയമാകുന്ന ബെറി പഴം.'),
  ('blueberry', 'kn', 'ಬ್ಲೂಬೆರಿ',    'ಮಮ್ಮಿ ಬೆರಿ ಮತ್ತು ಎಲೆ ಚುಕ್ಕೆ ರೋಗಕ್ಕೆ ತುತ್ತಾಗುವ ಬೆರಿ ಹಣ್ಣು.')
) AS t(slug, language_code, crop_name, description)
JOIN crops c ON c.slug = t.slug
ON CONFLICT (crop_id, language_code) DO UPDATE
  SET crop_name   = EXCLUDED.crop_name,
      description = EXCLUDED.description;

-- ---------------------------------------------------------------------------
-- crop_companions
--
-- Inserted in both directions so a query filtered on a single crop_id returns
-- the complete set of partners.
-- ---------------------------------------------------------------------------
INSERT INTO crop_companions (crop_id, companion_crop_id, relationship)
SELECT c.id, k.id, p.relationship::companion_relationship
FROM (VALUES
  ('tomato', 'potato', 'avoid'),      -- shared blight and pest pressure
  ('potato', 'tomato', 'avoid'),
  ('apple',  'potato', 'avoid'),
  ('potato', 'apple',  'avoid')
) AS p(crop_slug, companion_slug, relationship)
JOIN crops c ON c.slug = p.crop_slug
JOIN crops k ON k.slug = p.companion_slug
ON CONFLICT (crop_id, companion_crop_id) DO NOTHING;
