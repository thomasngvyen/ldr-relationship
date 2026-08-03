-- AlterTable
ALTER TABLE "date_ideas" ADD COLUMN IF NOT EXISTS "planned_date" TIMESTAMP(3);
ALTER TABLE "date_ideas" ADD COLUMN IF NOT EXISTS "day_before_notified_at" TIMESTAMP(3);
ALTER TABLE "date_ideas" ADD COLUMN IF NOT EXISTS "day_of_notified_at" TIMESTAMP(3);
