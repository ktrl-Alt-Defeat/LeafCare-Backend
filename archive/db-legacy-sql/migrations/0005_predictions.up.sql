-- 0005_predictions.up.sql
-- AI prediction history.

BEGIN;

-- ---------------------------------------------------------------------------
-- prediction_history
--
-- Append-only: a prediction is a record of what the model said at a point in
-- time and is never edited, so there is no updated_at. deleted_at supports the
-- user clearing their own history without destroying model telemetry.
--
-- crop_id and disease_id are both nullable on purpose:
--   * the model may recognise a disease without confidently identifying the crop
--   * a healthy leaf produces no disease at all
-- ---------------------------------------------------------------------------
CREATE TABLE prediction_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  -- Reference data is retained for audit even if a crop or disease is retired,
  -- so these detach rather than cascade.
  crop_id           UUID REFERENCES crops (id) ON DELETE SET NULL,
  disease_id        UUID REFERENCES diseases (id) ON DELETE SET NULL,

  is_healthy        BOOLEAN NOT NULL DEFAULT FALSE,

  -- Object-storage URL. Never store the base64 data URL the camera produces:
  -- it inflates the row, defeats caching and cannot be served by a CDN.
  uploaded_image    TEXT NOT NULL CHECK (length(btrim(uploaded_image)) > 0),

  confidence        NUMERIC(5, 2) NOT NULL
                      CHECK (confidence BETWEEN 0 AND 100),

  -- Which model produced this. Essential for evaluating a rollout and for
  -- re-scoring history after a retrain.
  model_version     TEXT NOT NULL,

  prediction_date   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,

  -- A healthy result must not also name a disease.
  CONSTRAINT prediction_healthy_has_no_disease CHECK (
    NOT is_healthy OR disease_id IS NULL
  )
);

-- The dominant query is "my recent scans, newest first".
CREATE INDEX prediction_history_user_recent_idx
  ON prediction_history (user_id, prediction_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX prediction_history_user_id_idx ON prediction_history (user_id);
CREATE INDEX prediction_history_prediction_date_idx
  ON prediction_history (prediction_date DESC);
CREATE INDEX prediction_history_disease_id_idx ON prediction_history (disease_id);
CREATE INDEX prediction_history_crop_id_idx ON prediction_history (crop_id);

-- Supports outbreak analytics: "confirmed cases of disease X in the last 14 days".
CREATE INDEX prediction_history_disease_date_idx
  ON prediction_history (disease_id, prediction_date DESC)
  WHERE disease_id IS NOT NULL AND deleted_at IS NULL;

COMMIT;
