import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService, TransactionDto } from '../transactions/transactions.service';
import { COUNTRY_CURRENCY, DEFAULT_COUNTRY, DEFAULT_CRYPTO_ASSETS } from '../common/default-assets';
import { SendCryptoDto } from './dto/send-crypto.dto';

// Shape matches WalletData/CryptoAsset/FiatAsset from the frontend's types.ts.
export interface WalletDataDto {
  totalBalanceUSD: number;
  crypto: Record<string, {
    balance: string;
    usdValue: number;
    price: number;
    changePercent: number;
    name: string;
    symbol: string;
    logoChar: string;
    colorClass: string;
  }>;
  fiat: Record<string, { balance: string; symbol: string; currencyCode: string }>;
  dailyChangePercent: number;
}

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

  // Idempotent: safe to call again (e.g. after a country change) without
  // clobbering existing balances.
  async ensureDefaultWallet(userId: string, country: string): Promise<void> {
    await this.prisma.$transaction([
      ...DEFAULT_CRYPTO_ASSETS.map((asset) =>
        this.prisma.cryptoAsset.upsert({
          where: { userId_symbol: { userId, symbol: asset.symbol } },
          update: {},
          create: {
            userId,
            symbol: asset.symbol,
            name: asset.name,
            logoChar: asset.logoChar,
            colorClass: asset.colorClass,
            price: asset.price,
            changePercent: asset.changePercent,
            balance: 0,
          },
        }),
      ),
      this.prisma.fiatAsset.upsert({
        where: {
          userId_currencyCode: {
            userId,
            currencyCode: (COUNTRY_CURRENCY[country] ?? COUNTRY_CURRENCY[DEFAULT_COUNTRY]).currencyCode,
          },
        },
        update: {},
        create: {
          userId,
          currencyCode: (COUNTRY_CURRENCY[country] ?? COUNTRY_CURRENCY[DEFAULT_COUNTRY]).currencyCode,
          symbol: (COUNTRY_CURRENCY[country] ?? COUNTRY_CURRENCY[DEFAULT_COUNTRY]).symbol,
          balance: 0,
        },
      }),
    ]);
  }

  async getWalletData(userId: string): Promise<WalletDataDto> {
    const [cryptoAssets, fiatAssets] = await Promise.all([
      this.prisma.cryptoAsset.findMany({ where: { userId } }),
      this.prisma.fiatAsset.findMany({ where: { userId } }),
    ]);

    const crypto: WalletDataDto['crypto'] = {};
    let totalBalanceUSD = 0;
    for (const asset of cryptoAssets) {
      const balance = Number(asset.balance);
      const price = Number(asset.price);
      const usdValue = balance * price;
      totalBalanceUSD += usdValue;
      crypto[asset.symbol] = {
        balance: asset.balance.toString(),
        usdValue,
        price,
        changePercent: asset.changePercent,
        name: asset.name,
        symbol: asset.symbol,
        logoChar: asset.logoChar,
        colorClass: asset.colorClass,
      };
    }

    const fiat: WalletDataDto['fiat'] = {};
    for (const asset of fiatAssets) {
      fiat[asset.currencyCode] = {
        balance: asset.balance.toString(),
        symbol: asset.symbol,
        currencyCode: asset.currencyCode,
      };
    }

    const dailyChangePercent = cryptoAssets.length
      ? cryptoAssets.reduce((sum, asset) => sum + asset.changePercent, 0) / cryptoAssets.length
      : 0;

    return { totalBalanceUSD, crypto, fiat, dailyChangePercent };
  }

  async sendCrypto(userId: string, dto: SendCryptoDto): Promise<TransactionDto> {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.cryptoAsset.findUnique({
        where: { userId_symbol: { userId, symbol: dto.cryptoSymbol } },
      });
      if (!asset) throw new NotFoundException(`No ${dto.cryptoSymbol} balance for this user`);

      const amount = Number(dto.amount);
      if (!(amount > 0)) throw new BadRequestException('Amount must be greater than zero');
      if (Number(asset.balance) < amount) throw new BadRequestException('Insufficient balance');

      await tx.cryptoAsset.update({
        where: { id: asset.id },
        data: { balance: { decrement: amount } },
      });

      // Same lifecycle as the old mock: record the send as PENDING first,
      // then flip it to COMPLETED. Settlement is instant here because this
      // is still simulated custody (no real blockchain broadcast) — once a
      // real custody provider is wired in, that provider's confirmation
      // (webhook/poll) should drive this transition instead of doing it
      // inline.
      const pending = await this.transactionsService.create(
        {
          userId,
          type: TransactionType.SEND,
          cryptoSymbol: dto.cryptoSymbol,
          cryptoAmount: amount,
          status: TransactionStatus.PENDING,
          addressTo: dto.recipientAddress,
          description: `Sent ${dto.cryptoSymbol} to ${dto.recipientAddress.substring(0, 10)}...`,
        },
        tx,
      );

      return this.transactionsService.updateStatus(pending.id, TransactionStatus.COMPLETED, tx);
    });
  }

  async getReceiveAddress(userId: string, cryptoSymbol: string) {
    // Placeholder until real custody / HD-wallet address generation is
    // wired up — deterministic and unique per user+asset, but not a real
    // on-chain address. Do not use for actual deposits.
    const address = `${cryptoSymbol.toLowerCase()}_${userId}_${Date.now().toString(36)}`;
    return { cryptoSymbol, address, qrCodeData: address };
  }
}
