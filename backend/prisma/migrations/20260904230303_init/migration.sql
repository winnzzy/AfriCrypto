-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL', 'SEND', 'RECEIVE', 'P2P_BUY', 'P2P_SELL', 'BILL_PAYMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "P2PTradeType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "p2pRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p2pTrades" INTEGER NOT NULL DEFAULT 0,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "profilePicUrl" TEXT,
    "avatarInitial" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_assets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "price" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "changePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "logoChar" TEXT NOT NULL,
    "colorClass" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiat_assets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiat_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "cryptoSymbol" TEXT NOT NULL,
    "cryptoAmount" DECIMAL(36,18) NOT NULL,
    "fiatAmount" DECIMAL(20,2),
    "fiatCurrency" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "addressTo" TEXT,
    "addressFrom" TEXT,
    "description" TEXT,
    "billerName" TEXT,
    "billDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p2p_offers" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "type" "P2PTradeType" NOT NULL,
    "cryptoSymbol" TEXT NOT NULL,
    "fiatCurrency" TEXT NOT NULL,
    "pricePerCoin" DECIMAL(24,2) NOT NULL,
    "availableAmountMin" DECIMAL(36,18) NOT NULL,
    "availableAmountMax" DECIMAL(36,18) NOT NULL,
    "limitFiatMin" DECIMAL(20,2) NOT NULL,
    "limitFiatMax" DECIMAL(20,2) NOT NULL,
    "paymentMethods" TEXT[],
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "paymentWindowMinutes" INTEGER NOT NULL DEFAULT 15,
    "avgReleaseTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "p2p_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "countries" TEXT[],

    CONSTRAINT "bill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "logoUrl" TEXT,
    "fields" JSONB NOT NULL,
    "fixedAmount" DECIMAL(20,2),
    "minAmount" DECIMAL(20,2),
    "maxAmount" DECIMAL(20,2),
    "paymentAssetSymbols" TEXT[],

    CONSTRAINT "billers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_assets_userId_symbol_key" ON "crypto_assets"("userId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "fiat_assets_userId_currencyCode_key" ON "fiat_assets"("userId", "currencyCode");

-- CreateIndex
CREATE INDEX "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "p2p_offers_cryptoSymbol_fiatCurrency_type_idx" ON "p2p_offers"("cryptoSymbol", "fiatCurrency", "type");

-- CreateIndex
CREATE INDEX "billers_country_categoryId_idx" ON "billers"("country", "categoryId");

-- AddForeignKey
ALTER TABLE "crypto_assets" ADD CONSTRAINT "crypto_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiat_assets" ADD CONSTRAINT "fiat_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_offers" ADD CONSTRAINT "p2p_offers_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billers" ADD CONSTRAINT "billers_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "bill_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
