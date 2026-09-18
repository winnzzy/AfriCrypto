CREATE TABLE "bill_webhook_events" (
  "id" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "providerReference" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bill_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bill_webhook_events_eventKey_key" ON "bill_webhook_events"("eventKey");
CREATE INDEX "bill_webhook_events_paymentId_createdAt_idx" ON "bill_webhook_events"("paymentId","createdAt");
ALTER TABLE "bill_webhook_events" ADD CONSTRAINT "bill_webhook_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "bill_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
