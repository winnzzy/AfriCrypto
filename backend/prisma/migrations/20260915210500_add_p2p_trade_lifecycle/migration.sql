CREATE TYPE "P2PTradeStatus" AS ENUM ('AWAITING_PAYMENT', 'PAYMENT_MARKED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'DISPUTED');

CREATE TABLE "p2p_trades" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "makerId" TEXT NOT NULL,
    "takerId" TEXT NOT NULL,
    "type" "P2PTradeType" NOT NULL,
    "cryptoSymbol" TEXT NOT NULL,
    "fiatCurrency" TEXT NOT NULL,
    "pricePerCoin" DECIMAL(24,2) NOT NULL,
    "cryptoAmount" DECIMAL(36,18) NOT NULL,
    "fiatAmount" DECIMAL(20,2) NOT NULL,
    "paymentMethods" TEXT[],
    "status" "P2PTradeStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paymentMarkedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "disputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "p2p_trades_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "p2p_trades_makerId_status_idx" ON "p2p_trades"("makerId", "status");
CREATE INDEX "p2p_trades_takerId_status_idx" ON "p2p_trades"("takerId", "status");
CREATE INDEX "p2p_trades_offerId_createdAt_idx" ON "p2p_trades"("offerId", "createdAt");

ALTER TABLE "p2p_trades" ADD CONSTRAINT "p2p_trades_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "p2p_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "p2p_trades" ADD CONSTRAINT "p2p_trades_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "p2p_trades" ADD CONSTRAINT "p2p_trades_takerId_fkey" FOREIGN KEY ("takerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
