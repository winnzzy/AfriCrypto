ALTER TYPE "P2PTradeStatus" ADD VALUE IF NOT EXISTS 'RESOLVED_BUYER';
ALTER TYPE "P2PTradeStatus" ADD VALUE IF NOT EXISTS 'RESOLVED_SELLER';
CREATE TABLE "p2p_dispute_resolutions" (
 "id" TEXT NOT NULL, "tradeId" TEXT NOT NULL, "resolvedById" TEXT NOT NULL,
 "outcome" TEXT NOT NULL, "reason" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "p2p_dispute_resolutions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "p2p_dispute_resolutions_tradeId_key" ON "p2p_dispute_resolutions"("tradeId");
CREATE INDEX "p2p_dispute_resolutions_resolvedById_createdAt_idx" ON "p2p_dispute_resolutions"("resolvedById","createdAt");
ALTER TABLE "p2p_dispute_resolutions" ADD CONSTRAINT "p2p_dispute_resolutions_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "p2p_trades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "p2p_dispute_resolutions" ADD CONSTRAINT "p2p_dispute_resolutions_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
