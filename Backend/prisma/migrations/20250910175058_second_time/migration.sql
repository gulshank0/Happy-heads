-- DropIndex
DROP INDEX "public"."users_googleId_key";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "college" TEXT,
ADD COLUMN     "interests" TEXT[],
ADD COLUMN     "location" JSONB,
ADD COLUMN     "major" TEXT,
ADD COLUMN     "year" INTEGER;

-- CreateTable
CREATE TABLE "public"."UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minAge" INTEGER NOT NULL DEFAULT 18,
    "maxAge" INTEGER NOT NULL DEFAULT 35,
    "preferredGenders" TEXT[],
    "maxDistance" INTEGER NOT NULL DEFAULT 50,
    "collegePreference" TEXT NOT NULL DEFAULT 'any',
    "majorPreference" TEXT NOT NULL DEFAULT 'any',
    "minYear" INTEGER NOT NULL DEFAULT 1,
    "maxYear" INTEGER NOT NULL DEFAULT 4,
    "ageWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "distanceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "interestsWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "collegeWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "majorWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "yearWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "personalityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalityTraits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "extroversion" INTEGER NOT NULL DEFAULT 5,
    "openness" INTEGER NOT NULL DEFAULT 5,
    "conscientiousness" INTEGER NOT NULL DEFAULT 5,
    "agreeableness" INTEGER NOT NULL DEFAULT 5,
    "neuroticism" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalityTraits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Like" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Match" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "public"."UserPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityTraits_userId_key" ON "public"."PersonalityTraits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_senderId_receiverId_key" ON "public"."Like"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_user1Id_user2Id_key" ON "public"."Match"("user1Id", "user2Id");

-- AddForeignKey
ALTER TABLE "public"."UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalityTraits" ADD CONSTRAINT "PersonalityTraits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
