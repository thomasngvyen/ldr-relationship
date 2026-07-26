-- Add nullable first, backfill from the author's couple, then enforce NOT NULL.
ALTER TABLE "mood_messages" ADD COLUMN "couple_id" TEXT;

UPDATE "mood_messages" AS mm
SET "couple_id" = c.id
FROM "couples" AS c
WHERE mm."couple_id" IS NULL
  AND (c."user_a_id" = mm."user_id" OR c."user_b_id" = mm."user_id");

-- Drop rows that cannot be attributed to a couple (orphaned authors).
DELETE FROM "mood_messages" WHERE "couple_id" IS NULL;

ALTER TABLE "mood_messages" ALTER COLUMN "couple_id" SET NOT NULL;

ALTER TABLE "mood_messages" ADD CONSTRAINT "mood_messages_couple_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;
