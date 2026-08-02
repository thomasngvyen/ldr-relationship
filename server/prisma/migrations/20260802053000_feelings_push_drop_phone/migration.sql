-- Drop leftover phone/carrier columns from the abandoned email-to-SMS approach (safe if absent)
ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_number";
ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_carrier";
DROP TYPE IF EXISTS "PhoneCarrier";

-- Feelings (idempotent for DBs that already applied an earlier feelings migration)
CREATE TABLE IF NOT EXISTS "feelings" (
    "id" TEXT NOT NULL,
    "feeling" TEXT NOT NULL,
    "reason" TEXT,
    "couple_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feelings_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feelings_couple_fkey'
  ) THEN
    ALTER TABLE "feelings"
      ADD CONSTRAINT "feelings_couple_fkey"
      FOREIGN KEY ("couple_id") REFERENCES "couples"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feelings_user_fkey'
  ) THEN
    ALTER TABLE "feelings"
      ADD CONSTRAINT "feelings_user_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Ensure updated_at exists if an older feelings table lacked it
ALTER TABLE "feelings" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Web Push subscriptions
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE "push_subscriptions"
      ADD CONSTRAINT "push_subscriptions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
