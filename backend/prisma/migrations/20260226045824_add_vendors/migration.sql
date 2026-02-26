-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('VENUE', 'CATERING', 'ATTIRE', 'GONDANG', 'WO', 'DOCUMENTATION', 'CHURCH');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "wedding_projects" ADD COLUMN     "guest_count" INTEGER;

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VendorType" NOT NULL,
    "location" TEXT NOT NULL,
    "min_price_estimate" DECIMAL(15,2) NOT NULL,
    "max_price_estimate" DECIMAL(15,2) NOT NULL,
    "capacity" INTEGER,
    "description" TEXT,
    "contact_info" TEXT,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "is_batak_specialist" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_vendors" (
    "id" TEXT NOT NULL,
    "notes" TEXT,
    "estimated_cost" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "project_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,

    CONSTRAINT "project_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_vendors_project_id_vendor_id_key" ON "project_vendors"("project_id", "vendor_id");

-- AddForeignKey
ALTER TABLE "project_vendors" ADD CONSTRAINT "project_vendors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "wedding_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_vendors" ADD CONSTRAINT "project_vendors_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
