-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "visiting_partner_id" TEXT;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_visiting_partner_fkey" FOREIGN KEY ("visiting_partner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
