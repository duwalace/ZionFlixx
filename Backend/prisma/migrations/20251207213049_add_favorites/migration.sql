-- CreateTable
CREATE TABLE "Favorite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "titleId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_titleId_key" ON "Favorite"("userId", "titleId");
