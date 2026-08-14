-- 0008_notifications.up.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- notifications
--
-- read_at carries strictly more information than a boolean (it answers "when"),
-- and is_read is derived from it so the flag can never disagree with the
-- timestamp.
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        notification_type NOT NULL DEFAULT 'system',
  title       TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  message     TEXT NOT NULL CHECK (length(btrim(message)) > 0),

  -- Optional deep link, e.g. /diagnosis?id=... or /community/<post>.
  link_url    TEXT,

  read_at     TIMESTAMPTZ,
  is_read     BOOLEAN GENERATED ALWAYS AS (read_at IS NOT NULL) STORED,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_id_idx
  ON notifications (user_id, created_at DESC);

-- Powers the unread badge without scanning read history.
CREATE INDEX notifications_unread_idx
  ON notifications (user_id)
  WHERE read_at IS NULL;

COMMIT;
