-- 0007_marketplace.up.sql
-- Products, orders, order items and reviews.

BEGIN;

-- ---------------------------------------------------------------------------
-- products
--
-- rating and review_count are deliberately absent: both are derivable from
-- reviews, and storing them invites drift. See docs/database-design.md for the
-- materialised-view path if the aggregate ever becomes a hot path.
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name              TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  category          product_category NOT NULL,
  price             NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  currency_code     CHAR(3) NOT NULL DEFAULT 'INR'
                      CHECK (currency_code ~ '^[A-Z]{3}$'),
  quantity          INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),

  -- Free text rather than an ENUM: sellers list by bottle, bag, packet, kg,
  -- litre and more, and the set grows with the catalogue.
  unit              TEXT NOT NULL DEFAULT 'unit',

  is_organic        BOOLEAN NOT NULL DEFAULT FALSE,
  seller_location   TEXT,
  description       TEXT,
  image_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX products_category_idx
  ON products (category, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX products_seller_id_idx ON products (seller_id);

CREATE INDEX products_name_trgm_idx
  ON products USING gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- orders
--
-- Header only. Line items live in order_items so a single order can contain
-- several products.
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id          UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  total_price       NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
  currency_code     CHAR(3) NOT NULL DEFAULT 'INR'
                      CHECK (currency_code ~ '^[A-Z]{3}$'),
  delivery_address  TEXT NOT NULL CHECK (length(btrim(delivery_address)) > 0),
  status            order_status NOT NULL DEFAULT 'pending',
  ordered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX orders_buyer_id_idx ON orders (buyer_id, ordered_at DESC);
CREATE INDEX orders_status_idx ON orders (status, ordered_at DESC);

COMMENT ON COLUMN orders.buyer_id IS
  'ON DELETE RESTRICT: financial records must survive account deletion. '
  'Anonymise the user row instead of removing it.';

COMMENT ON COLUMN orders.total_price IS
  'Must equal SUM(order_items.quantity * unit_price). Enforced in the '
  'application transaction; PostgreSQL CHECK cannot span tables.';

-- ---------------------------------------------------------------------------
-- order_items
--
-- unit_price and product_name are snapshotted at purchase time. Without the
-- snapshot, a seller editing a price or title would silently rewrite the value
-- and contents of every historical order.
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  product_name  TEXT NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One line per product; increase the quantity instead of adding a duplicate.
  CONSTRAINT order_items_unique_product UNIQUE (order_id, product_id)
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);
CREATE INDEX order_items_product_id_idx ON order_items (product_id);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT reviews_one_per_user UNIQUE (product_id, user_id)
);

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX reviews_product_id_idx ON reviews (product_id, created_at DESC);
CREATE INDEX reviews_user_id_idx ON reviews (user_id);

COMMIT;
