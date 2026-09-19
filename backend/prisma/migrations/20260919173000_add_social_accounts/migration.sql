ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE TABLE "social_accounts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "social_accounts_provider_providerAccountId_key" ON "social_accounts"("provider", "providerAccountId");
CREATE INDEX "social_accounts_userId_idx" ON "social_accounts"("userId");
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
