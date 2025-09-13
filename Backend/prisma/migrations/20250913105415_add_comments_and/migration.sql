/*
  Warnings:

  - You are about to drop the column `postId` on the `likes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `likes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[senderId,receiverId]` on the table `likes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiverId` to the `likes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `likes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."likes" DROP CONSTRAINT "likes_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."likes" DROP CONSTRAINT "likes_userId_fkey";

-- DropIndex
DROP INDEX "public"."likes_userId_postId_key";

-- AlterTable
ALTER TABLE "public"."PersonalityTraits" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."likes" DROP COLUMN "postId",
DROP COLUMN "userId",
ADD COLUMN     "receiverId" TEXT NOT NULL,
ADD COLUMN     "senderId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "likes_senderId_receiverId_key" ON "public"."likes"("senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
