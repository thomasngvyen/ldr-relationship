-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('HAPPY', 'SAD', 'ANGRY', 'EXCITED', 'CONFUSED', 'BORED', 'TIRED', 'SICK', 'STRESSED', 'RELAXED', 'HORNY', 'SLEEPY');

-- CreateTable
CREATE TABLE "mood_messages" (
    "id" TEXT NOT NULL,
    "mood" "Mood" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_messages_pkey" PRIMARY KEY ("id")
);
