ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'REVERSED';
ALTER TABLE "bill_payments"
  ADD COLUMN "providerReference" TEXT,
  ADD COLUMN "failureReason" TEXT,
  ADD COLUMN "processingAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "reversedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "bill_payments_providerReference_key" ON "bill_payments"("providerReference");
