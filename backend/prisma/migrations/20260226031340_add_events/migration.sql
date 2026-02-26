/*
  Warnings:

  - You are about to drop the column `project_id` on the `budget_categories` table. All the data in the column will be lost.
  - Added the required column `event_id` to the `budget_categories` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PESTA_ADAT', 'THREE_M');

-- DropForeignKey
ALTER TABLE "budget_categories" DROP CONSTRAINT "budget_categories_project_id_fkey";

-- AlterTable
ALTER TABLE "budget_categories" DROP COLUMN "project_id",
ADD COLUMN     "event_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "wedding_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
