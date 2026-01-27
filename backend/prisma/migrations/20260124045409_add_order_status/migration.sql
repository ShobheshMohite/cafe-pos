/*
  Warnings:

  - You are about to alter the column `total` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'UNPAID',
ALTER COLUMN "total" SET DATA TYPE INTEGER,
ALTER COLUMN "tableNo" DROP DEFAULT;
