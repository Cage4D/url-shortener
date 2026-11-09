-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "links" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(32) NOT NULL,
    "slug_key" VARCHAR(32) NOT NULL,
    "long_url" VARCHAR(2048) NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "links_slug_key_key" ON "links"("slug_key");

