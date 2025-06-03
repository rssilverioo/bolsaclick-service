/*
  Warnings:

  - You are about to drop the column `externalId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `externalName` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `universityId` on the `Course` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_universityId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "externalId",
DROP COLUMN "externalName",
DROP COLUMN "universityId";

-- CreateTable
CREATE TABLE "UniversityCourse" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "externalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniversityCourse_courseId_universityId_key" ON "UniversityCourse"("courseId", "universityId");

-- AddForeignKey
ALTER TABLE "UniversityCourse" ADD CONSTRAINT "UniversityCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityCourse" ADD CONSTRAINT "UniversityCourse_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
