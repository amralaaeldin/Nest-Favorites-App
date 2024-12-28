/*
  Warnings:

  - A unique constraint covering the columns `[title,favoriteListId]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "image" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "Movie_title_favoriteListId_key" ON "Movie"("title", "favoriteListId");
