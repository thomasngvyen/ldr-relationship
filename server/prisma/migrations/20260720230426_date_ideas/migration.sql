-- CreateEnum
CREATE TYPE "DateIdeaCategory" AS ENUM ('OUTDOOR', 'INDOOR', 'ACTIVE', 'CASUAL', 'ROMANTIC', 'ADVENTUROUS', 'COZY');

-- CreateEnum
CREATE TYPE "DateIdeaStatus" AS ENUM ('IDEA', 'VOTED', 'SELECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "date_ideas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "DateIdeaCategory" NOT NULL,
    "status" "DateIdeaStatus" NOT NULL DEFAULT 'IDEA',
    "couple_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_idea_votes" (
    "id" TEXT NOT NULL,
    "date_idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_idea_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "date_idea_votes_date_idea_id_user_id_key" ON "date_idea_votes"("date_idea_id", "user_id");

-- AddForeignKey
ALTER TABLE "date_ideas" ADD CONSTRAINT "date_ideas_couple_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_ideas" ADD CONSTRAINT "date_ideas_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_idea_votes" ADD CONSTRAINT "date_idea_votes_date_idea_fkey" FOREIGN KEY ("date_idea_id") REFERENCES "date_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_idea_votes" ADD CONSTRAINT "date_idea_votes_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
