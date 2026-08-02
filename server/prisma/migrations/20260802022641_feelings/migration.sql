-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_number" TEXT;

-- CreateTable
CREATE TABLE "feelings" (
    "id" TEXT NOT NULL,
    "feeling" TEXT NOT NULL,
    "reason" TEXT,
    "couple_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "feelings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "feelings" ADD CONSTRAINT "feelings_couple_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feelings" ADD CONSTRAINT "feelings_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
