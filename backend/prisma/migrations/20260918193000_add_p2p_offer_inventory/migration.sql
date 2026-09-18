ALTER TABLE "p2p_offers" ADD COLUMN "remainingAmount" DECIMAL(36,18);
UPDATE "p2p_offers" SET "remainingAmount" = "availableAmountMax" WHERE "remainingAmount" IS NULL;
ALTER TABLE "p2p_offers" ALTER COLUMN "remainingAmount" SET NOT NULL;
CREATE INDEX "p2p_offers_inventory_idx" ON "p2p_offers"("isOnline", "remainingAmount");
