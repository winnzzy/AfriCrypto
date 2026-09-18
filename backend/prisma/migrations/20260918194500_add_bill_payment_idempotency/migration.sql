CREATE TABLE "bill_payments" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "billerId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "paymentAssetSymbol" TEXT NOT NULL,
  "amountFiat" DECIMAL(20,2) NOT NULL,
  "fiatCurrency" TEXT NOT NULL,
  "paymentAmount" DECIMAL(36,18) NOT NULL,
  "details" JSONB NOT NULL,
  "transactionId" TEXT,
  "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bill_payments_userId_idempotencyKey_key" ON "bill_payments"("userId","idempotencyKey");
CREATE UNIQUE INDEX "bill_payments_transactionId_key" ON "bill_payments"("transactionId");
CREATE INDEX "bill_payments_userId_createdAt_idx" ON "bill_payments"("userId","createdAt");
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
