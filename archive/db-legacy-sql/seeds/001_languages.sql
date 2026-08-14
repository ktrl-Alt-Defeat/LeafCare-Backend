-- 001_languages.sql
-- The six languages the application ships in.
-- Idempotent: safe to re-run.

INSERT INTO languages (language_code, language_name, native_name, sort_order) VALUES
  ('en', 'English',   'English',   1),
  ('ta', 'Tamil',     'தமிழ்',      2),
  ('hi', 'Hindi',     'हिन्दी',      3),
  ('te', 'Telugu',    'తెలుగు',     4),
  ('ml', 'Malayalam', 'മലയാളം',    5),
  ('kn', 'Kannada',   'ಕನ್ನಡ',      6)
ON CONFLICT (language_code) DO UPDATE
  SET language_name = EXCLUDED.language_name,
      native_name   = EXCLUDED.native_name,
      sort_order    = EXCLUDED.sort_order;
