-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMITE_NATIONAL', 'CENTRE_GENERAL', 'CENTRE', 'CHAPITRE', 'DISTRICT', 'GROUPE', 'SOUS_GROUPE', 'MEMBRE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_INVITATION', 'PENDING_APPROVAL', 'ACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role",
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING_INVITATION',
    "pendingTargetRole" "Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "targetRole" "Role" NOT NULL,
    "issuerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingApproval" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "approverRole" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_codeHash_key" ON "Invitation"("codeHash");

-- CreateIndex
CREATE INDEX "Invitation_issuerId_idx" ON "Invitation"("issuerId");

-- CreateIndex
CREATE INDEX "OnboardingApproval_subjectUserId_idx" ON "OnboardingApproval"("subjectUserId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingApproval_subjectUserId_approverUserId_key" ON "OnboardingApproval"("subjectUserId", "approverUserId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingApproval" ADD CONSTRAINT "OnboardingApproval_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingApproval" ADD CONSTRAINT "OnboardingApproval_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
