ALTER TABLE "billers" ADD COLUMN "fiatCurrency" TEXT;
UPDATE "billers" SET "fiatCurrency" = CASE
  WHEN "country" = 'Nigeria' THEN 'NGN'
  WHEN "country" = 'Kenya' THEN 'KES'
  WHEN "country" = 'Ghana' THEN 'GHS'
  WHEN "country" = 'South Africa' THEN 'ZAR'
  WHEN "country" = 'Egypt' THEN 'EGP'
  ELSE NULL
END;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "billers" WHERE "fiatCurrency" IS NULL) THEN
    RAISE EXCEPTION 'Cannot infer fiatCurrency for one or more existing billers';
  END IF;
END $$;
ALTER TABLE "billers" ALTER COLUMN "fiatCurrency" SET NOT NULL;
