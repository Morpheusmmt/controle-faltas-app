/*
  Warnings:

  - You are about to drop the column `totalClasses` on the `Subject` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,userId]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "totalClasses",
ADD COLUMN     "classDurationHours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalWorkloadHours" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_userId_key" ON "Subject"("name", "userId");
