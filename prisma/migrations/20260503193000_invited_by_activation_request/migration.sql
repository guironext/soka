-- AlterTable
ALTER TABLE "User" ADD COLUMN "invitedByUserId" TEXT;

-- CreateTable
CREATE TABLE "ActivationRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivationRequest_recipientId_idx" ON "ActivationRequest"("recipientId");

-- CreateIndex
CREATE INDEX "ActivationRequest_requesterId_idx" ON "ActivationRequest"("requesterId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationRequest" ADD CONSTRAINT "ActivationRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationRequest" ADD CONSTRAINT "ActivationRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
