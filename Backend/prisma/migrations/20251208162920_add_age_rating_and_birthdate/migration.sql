-- AlterTable
ALTER TABLE "User" ADD COLUMN "birthDate" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Title" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "hlsPath" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "ageRating" TEXT NOT NULL DEFAULT 'L'
);
INSERT INTO "new_Title" ("coverUrl", "description", "duration", "hlsPath", "id", "name") SELECT "coverUrl", "description", "duration", "hlsPath", "id", "name" FROM "Title";
DROP TABLE "Title";
ALTER TABLE "new_Title" RENAME TO "Title";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
