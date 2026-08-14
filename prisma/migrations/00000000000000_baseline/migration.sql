-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('farmer', 'expert', 'admin');

-- CreateEnum
CREATE TYPE "crop_season" AS ENUM ('kharif', 'rabi', 'zaid', 'perennial');

-- CreateEnum
CREATE TYPE "water_requirement" AS ENUM ('low', 'moderate', 'intermediate', 'high');

-- CreateEnum
CREATE TYPE "sunlight_exposure" AS ENUM ('full_sun', 'partial_shade', 'full_shade');

-- CreateEnum
CREATE TYPE "drainage_level" AS ENUM ('poor', 'moderate', 'good');

-- CreateEnum
CREATE TYPE "crop_life_cycle" AS ENUM ('annual', 'biennial', 'perennial');

-- CreateEnum
CREATE TYPE "labour_level" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "nutrient_unit" AS ENUM ('kg_per_hectare', 'g_per_plant');

-- CreateEnum
CREATE TYPE "companion_relationship" AS ENUM ('beneficial', 'neutral', 'avoid');

-- CreateEnum
CREATE TYPE "disease_severity" AS ENUM ('low', 'moderate', 'high', 'severe');

-- CreateEnum
CREATE TYPE "pathogen_type" AS ENUM ('fungal', 'bacterial', 'viral', 'pest', 'nutrient_deficiency', 'abiotic');

-- CreateEnum
CREATE TYPE "post_category" AS ENUM ('disease_help', 'crop_advice', 'fertilizer', 'irrigation', 'weather', 'marketplace', 'general');

-- CreateEnum
CREATE TYPE "product_category" AS ENUM ('seeds', 'fertilizers', 'crop_protection', 'tools', 'equipment');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('weather_alert', 'disease_alert', 'community_reply', 'order_update', 'system');

-- CreateTable
CREATE TABLE "languages" (
    "language_code" VARCHAR(10) NOT NULL,
    "language_name" VARCHAR(100) NOT NULL,
    "native_name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("language_code")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'farmer',
    "language_code" VARCHAR(10) NOT NULL DEFAULT 'en',
    "phone" VARCHAR(20),
    "district" VARCHAR(100),
    "state" VARCHAR(100),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "farm_size_acres" DECIMAL(8,2),
    "experience_years" SMALLINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "scientific_name" VARCHAR(150),
    "temperature_min_c" DECIMAL(4,1),
    "temperature_max_c" DECIMAL(4,1),
    "ph_min" DECIMAL(3,1),
    "ph_max" DECIMAL(3,1),
    "rainfall_min_mm" INTEGER,
    "rainfall_max_mm" INTEGER,
    "humidity_min_pct" INTEGER,
    "humidity_max_pct" INTEGER,
    "growing_duration_days_min" INTEGER,
    "growing_duration_days_max" INTEGER,
    "water_req" "water_requirement",
    "sunlight" "sunlight_exposure",
    "drainage" "drainage_level",
    "life_cycle" "crop_life_cycle",
    "labour_req" "labour_level",
    "nutrient_unit" "nutrient_unit",
    "nitrogen_requirement" DECIMAL(6,2),
    "phosphorus_requirement" DECIMAL(6,2),
    "potassium_requirement" DECIMAL(6,2),
    "row_spacing_cm" INTEGER,
    "plant_spacing_cm" INTEGER,
    "sowing_depth_cm" DECIMAL(4,1),
    "icon_name" VARCHAR(50),
    "image_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_translations" (
    "crop_id" UUID NOT NULL,
    "language_code" VARCHAR(10) NOT NULL,
    "crop_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "sowing_method" TEXT,
    "harvesting_guide" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_translations_pkey" PRIMARY KEY ("crop_id","language_code")
);

-- CreateTable
CREATE TABLE "crop_seasons" (
    "crop_id" UUID NOT NULL,
    "season" "crop_season" NOT NULL,

    CONSTRAINT "crop_seasons_pkey" PRIMARY KEY ("crop_id","season")
);

-- CreateTable
CREATE TABLE "user_crops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "crop_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_companions" (
    "crop_id" UUID NOT NULL,
    "companion_crop_id" UUID NOT NULL,
    "relationship" "companion_relationship" NOT NULL DEFAULT 'beneficial',

    CONSTRAINT "crop_companions_pkey" PRIMARY KEY ("crop_id","companion_crop_id")
);

-- CreateTable
CREATE TABLE "diseases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "scientific_name" VARCHAR(150),
    "severity" "disease_severity" NOT NULL DEFAULT 'moderate',
    "pathogen_type" "pathogen_type" NOT NULL DEFAULT 'fungal',
    "contagious" BOOLEAN NOT NULL DEFAULT true,
    "icon_name" VARCHAR(50),
    "image_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disease_translations" (
    "disease_id" UUID NOT NULL,
    "language_code" VARCHAR(10) NOT NULL,
    "disease_name" VARCHAR(150) NOT NULL,
    "symptoms" TEXT[],
    "causes" TEXT[],
    "prevention" TEXT[],
    "organic_treatment" TEXT[],
    "chemical_treatment" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disease_translations_pkey" PRIMARY KEY ("disease_id","language_code")
);

-- CreateTable
CREATE TABLE "crop_diseases" (
    "crop_id" UUID NOT NULL,
    "disease_id" UUID NOT NULL,
    "is_primary_host" BOOLEAN NOT NULL DEFAULT true,
    "severity_override" "disease_severity",

    CONSTRAINT "crop_diseases_pkey" PRIMARY KEY ("crop_id","disease_id")
);

-- CreateTable
CREATE TABLE "prediction_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "crop_id" UUID,
    "disease_id" UUID,
    "is_healthy" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_image" VARCHAR(500) NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL,
    "model_version" VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    "prediction_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "prediction_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "crop_id" UUID,
    "category" "post_category" NOT NULL DEFAULT 'general',
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("post_id","user_id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" UUID NOT NULL,
    "category" "product_category" NOT NULL DEFAULT 'fertilizers',
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "unit" VARCHAR(50) NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_organic" BOOLEAN NOT NULL DEFAULT false,
    "image_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" UUID NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "delivery_address" TEXT NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "ordered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR(150) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" TEXT NOT NULL,
    "link_url" VARCHAR(500),
    "read_at" TIMESTAMPTZ(6),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_category_translations" (
    "category_id" UUID NOT NULL,
    "language_code" VARCHAR(10) NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "knowledge_category_translations_pkey" PRIMARY KEY ("category_id","language_code")
);

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "author_id" UUID,
    "slug" VARCHAR(150) NOT NULL,
    "hero_image_url" VARCHAR(500),
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_article_translations" (
    "article_id" UUID NOT NULL,
    "language_code" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_article_translations_pkey" PRIMARY KEY ("article_id","language_code")
);

-- CreateTable
CREATE TABLE "knowledge_article_crops" (
    "article_id" UUID NOT NULL,
    "crop_id" UUID NOT NULL,

    CONSTRAINT "knowledge_article_crops_pkey" PRIMARY KEY ("article_id","crop_id")
);

-- CreateTable
CREATE TABLE "knowledge_article_diseases" (
    "article_id" UUID NOT NULL,
    "disease_id" UUID NOT NULL,

    CONSTRAINT "knowledge_article_diseases_pkey" PRIMARY KEY ("article_id","disease_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "crops_slug_key" ON "crops"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "diseases_slug_key" ON "diseases"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_categories_slug_key" ON "knowledge_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_articles_slug_key" ON "knowledge_articles"("slug");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("language_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_translations" ADD CONSTRAINT "crop_translations_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_translations" ADD CONSTRAINT "crop_translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("language_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_seasons" ADD CONSTRAINT "crop_seasons_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_crops" ADD CONSTRAINT "user_crops_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_crops" ADD CONSTRAINT "user_crops_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_companions" ADD CONSTRAINT "crop_companions_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_companions" ADD CONSTRAINT "crop_companions_companion_crop_id_fkey" FOREIGN KEY ("companion_crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disease_translations" ADD CONSTRAINT "disease_translations_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disease_translations" ADD CONSTRAINT "disease_translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("language_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_diseases" ADD CONSTRAINT "crop_diseases_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_diseases" ADD CONSTRAINT "crop_diseases_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_history" ADD CONSTRAINT "prediction_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_history" ADD CONSTRAINT "prediction_history_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_history" ADD CONSTRAINT "prediction_history_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_category_translations" ADD CONSTRAINT "knowledge_category_translations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "knowledge_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_category_translations" ADD CONSTRAINT "knowledge_category_translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("language_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "knowledge_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_translations" ADD CONSTRAINT "knowledge_article_translations_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_translations" ADD CONSTRAINT "knowledge_article_translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("language_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_crops" ADD CONSTRAINT "knowledge_article_crops_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_crops" ADD CONSTRAINT "knowledge_article_crops_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_diseases" ADD CONSTRAINT "knowledge_article_diseases_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_diseases" ADD CONSTRAINT "knowledge_article_diseases_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

