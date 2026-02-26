-- Backfill existing projects with PESTA_ADAT as default
ALTER TABLE "wedding_projects" ADD COLUMN "event_type" "EventType";
UPDATE "wedding_projects" SET "event_type" = 'PESTA_ADAT' WHERE "event_type" IS NULL;
ALTER TABLE "wedding_projects" ALTER COLUMN "event_type" SET NOT NULL;
