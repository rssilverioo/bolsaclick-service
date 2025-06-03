/*
  Warnings:

  - A unique constraint covering the columns `[city,state]` on the table `City` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "City_city_state_key" ON "City"("city", "state");
