// Seeds reference data (bill categories/billers) mirrored from the
// frontend's constants.ts mock data, so /bills endpoints return real rows
// without needing an admin UI yet. Run with `npm run prisma:seed`.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const billCategories = [
  { id: 'airtime', name: 'Airtime Top-up', iconName: 'Smartphone', countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Egypt'] },
  { id: 'data', name: 'Data Bundles', iconName: 'Wifi', countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Egypt'] },
  { id: 'electricity', name: 'Electricity Bill', iconName: 'Zap', countries: ['Nigeria', 'Kenya', 'South Africa'] },
  { id: 'tv', name: 'TV Subscription', iconName: 'Tv', countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa'] },
  { id: 'betting', name: 'Betting Wallet', iconName: 'Gamepad2', countries: ['Nigeria', 'Kenya', 'Ghana'] },
  { id: 'internet', name: 'Internet Services', iconName: 'Router', countries: ['Nigeria', 'Kenya', 'South Africa'] },
];

const billers = [
  {
    id: 'nga-mtn-airtime', name: 'MTN Airtime (NG)', categoryId: 'airtime', country: 'Nigeria', fiatCurrency: 'NGN', logoUrl: '/img/mtn-logo.png',
    fields: [
      { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '080XXXXXXXX', required: true, validationRegex: '^(0[789][01]\\d{8})$' },
      { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 500', required: true },
    ],
    minAmount: 50, maxAmount: 10000, paymentAssetSymbols: ['NGN', 'USDT'],
  },
  {
    id: 'nga-glo-airtime', name: 'Glo Airtime (NG)', categoryId: 'airtime', country: 'Nigeria', fiatCurrency: 'NGN', logoUrl: '/img/glo-logo.png',
    fields: [
      { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '080XXXXXXXX', required: true },
      { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 500', required: true },
    ],
    minAmount: 50, maxAmount: 10000, paymentAssetSymbols: ['NGN', 'USDT'],
  },
  {
    id: 'nga-ikeja-electric', name: 'Ikeja Electric (NG)', categoryId: 'electricity', country: 'Nigeria', fiatCurrency: 'NGN', logoUrl: '/img/ikeja-electric-logo.png',
    fields: [
      { id: 'meterNumber', label: 'Meter Number', type: 'text', placeholder: 'Enter meter number', required: true },
      { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 5000', required: true },
    ],
    minAmount: 1000, maxAmount: 100000, paymentAssetSymbols: ['NGN', 'USDT', 'BTC'],
  },
  {
    id: 'nga-dstv', name: 'DStv Subscription (NG)', categoryId: 'tv', country: 'Nigeria', fiatCurrency: 'NGN', logoUrl: '/img/dstv-logo.png',
    fields: [
      { id: 'smartcardNumber', label: 'Smartcard Number', type: 'text', placeholder: 'Enter smartcard number', required: true },
      { id: 'bouquet', label: 'Bouquet', type: 'select', options: [{ value: 'compact', label: 'Compact' }, { value: 'premium', label: 'Premium' }], required: true },
      // Pricing is provider-controlled. Until a live catalogue is integrated, collect
      // the amount explicitly instead of inventing bouquet prices in application code.
      { id: 'amount', label: 'Amount', type: 'number', placeholder: 'Enter subscription amount', required: true },
    ],
    paymentAssetSymbols: ['NGN'],
  },
  {
    id: 'nga-bet9ja', name: 'Bet9ja Wallet Top-up (NG)', categoryId: 'betting', country: 'Nigeria', fiatCurrency: 'NGN', logoUrl: '/img/bet9ja-logo.png',
    fields: [
      { id: 'userId', label: 'Bet9ja User ID', type: 'text', placeholder: 'Enter User ID', required: true },
      { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 1000', required: true },
    ],
    minAmount: 100, maxAmount: 50000, paymentAssetSymbols: ['NGN', 'USDT'],
  },
  {
    id: 'ken-safaricom-airtime', name: 'Safaricom Airtime (KE)', categoryId: 'airtime', country: 'Kenya', fiatCurrency: 'KES', logoUrl: '/img/safaricom-logo.png',
    fields: [
      { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '07XXXXXXXX', required: true },
      { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 100', required: true },
    ],
    minAmount: 20, maxAmount: 5000, paymentAssetSymbols: ['KES', 'USDT'],
  },
  {
    id: 'ken-kplc-prepaid', name: 'KPLC Prepaid Token (KE)', categoryId: 'electricity', country: 'Kenya', fiatCurrency: 'KES', logoUrl: '/img/kplc-logo.png',
    fields: [
      { id: 'meterNumber', label: 'Meter Number', type: 'text', placeholder: 'Enter meter number', required: true },
      { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 500', required: true },
    ],
    minAmount: 50, maxAmount: 35000, paymentAssetSymbols: ['KES', 'USDT'],
  },
];

async function main() {
  for (const category of billCategories) {
    await prisma.billCategory.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  for (const biller of billers) {
    await prisma.biller.upsert({
      where: { id: biller.id },
      update: biller,
      create: biller,
    });
  }

  console.log(`Seeded ${billCategories.length} bill categories and ${billers.length} billers.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
