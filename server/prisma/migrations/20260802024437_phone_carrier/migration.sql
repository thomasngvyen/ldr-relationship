-- CreateEnum
CREATE TYPE "PhoneCarrier" AS ENUM ('VERIZON', 'ATT', 'TMOBILE', 'SPRINT', 'US_CELLULAR', 'CRICKET', 'BOOST', 'METRO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_carrier" "PhoneCarrier";
