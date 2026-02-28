-- CreateTable
CREATE TABLE "vendor_type_masters" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "default_category_name" TEXT,
    "is_price_per_pax" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_type_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_type_masters_code_key" ON "vendor_type_masters"("code");

-- Convert vendors.type from enum to text (preserving existing data)
ALTER TABLE "vendors" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

-- DropEnum
DROP TYPE "VendorType";
