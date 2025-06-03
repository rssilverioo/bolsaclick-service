-- CreateEnum
CREATE TYPE "CourseModality" AS ENUM ('GRADUACAO', 'POS', 'TECNICO');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "modality" "CourseModality" NOT NULL DEFAULT 'GRADUACAO';
