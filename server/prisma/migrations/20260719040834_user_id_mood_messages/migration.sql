/*
  Warnings:

  - Added the required column `user_id` to the `mood_messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "mood_messages" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "mood_messages" ADD CONSTRAINT "mood_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
