-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "couple_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_couple_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
