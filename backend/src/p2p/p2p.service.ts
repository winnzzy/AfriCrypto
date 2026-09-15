import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { P2POffer, P2PTradeStatus, Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryOffersDto } from './dto/query-offers.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { InitiateTradeDto } from './dto/initiate-trade.dto';

type OfferWithTrader = P2POffer & { trader: User };

export interface P2POfferDto {
  id: string;
  traderName: string;
  traderAvatarInitial: string;
  traderRating: number;
  traderTrades: number;
  pricePerCoin: string;
  availableAmountCrypto: string;
  limitFiat: string;
  paymentMethods: string[];
  isOnline: boolean;
  isVerified: boolean;
  responseTime: string;
  cryptoSymbol: string;
  fiatCurrency: string;
  paymentWindowMinutes: number;
  avgReleaseTimeMinutes: number;
}

@Injectable()
export class P2pService {
  constructor(private readonly prisma: PrismaService) {}

  private decimal(value: string, field: string): Prisma.Decimal {
    try {
      const result = new Prisma.Decimal(value);
      if (!result.isFinite()) throw new Error('non-finite');
      return result;
    } catch {
      throw new BadRequestException(`${field} must be a valid number`);
    }
  }

  private toDto(offer: OfferWithTrader): P2POfferDto {
    return {
      id: offer.id,
      traderName: offer.trader.username,
      traderAvatarInitial: offer.trader.avatarInitial,
      traderRating: offer.trader.p2pRating,
      traderTrades: offer.trader.p2pTrades,
      pricePerCoin: offer.pricePerCoin.toString(),
      availableAmountCrypto: `${offer.availableAmountMin.toString()} - ${offer.availableAmountMax.toString()} ${offer.cryptoSymbol}`,
      limitFiat: `${offer.limitFiatMin.toString()} - ${offer.limitFiatMax.toString()}`,
      paymentMethods: offer.paymentMethods,
      isOnline: offer.isOnline,
      isVerified: offer.trader.isVerified,
      responseTime: `~${offer.avgReleaseTimeMinutes} min`,
      cryptoSymbol: offer.cryptoSymbol,
      fiatCurrency: offer.fiatCurrency,
      paymentWindowMinutes: offer.paymentWindowMinutes,
      avgReleaseTimeMinutes: offer.avgReleaseTimeMinutes,
    };
  }

  async findOffers(query: QueryOffersDto): Promise<P2POfferDto[]> {
    const offers = await this.prisma.p2POffer.findMany({
      where: { cryptoSymbol: query.cryptoSymbol, fiatCurrency: query.fiatCurrency, type: query.type, isOnline: true },
      include: { trader: true },
      orderBy: { createdAt: 'desc' },
    });
    return offers.map((o) => this.toDto(o));
  }

  async createOffer(traderId: string, dto: CreateOfferDto): Promise<P2POfferDto> {
    const price = this.decimal(dto.pricePerCoin, 'pricePerCoin');
    const cryptoMin = this.decimal(dto.availableAmountMin, 'availableAmountMin');
    const cryptoMax = this.decimal(dto.availableAmountMax, 'availableAmountMax');
    const fiatMin = this.decimal(dto.limitFiatMin, 'limitFiatMin');
    const fiatMax = this.decimal(dto.limitFiatMax, 'limitFiatMax');
    if (price.lte(0)) throw new BadRequestException('Offer price must be greater than zero');
    if (cryptoMin.lte(0) || cryptoMax.lte(0) || cryptoMin.gt(cryptoMax)) throw new BadRequestException('Invalid crypto amount range');
    if (fiatMin.lte(0) || fiatMax.lte(0) || fiatMin.gt(fiatMax)) throw new BadRequestException('Invalid fiat limit range');
    if (!dto.paymentMethods.length) throw new BadRequestException('At least one payment method is required');
    if (fiatMin.gt(cryptoMax.mul(price)) || fiatMax.lt(cryptoMin.mul(price))) throw new BadRequestException('Fiat limits do not overlap the offered crypto range');
    const offer = await this.prisma.p2POffer.create({ data: { traderId, ...dto }, include: { trader: true } });
    return this.toDto(offer);
  }

  async initiateTrade(userId: string, dto: InitiateTradeDto) {
    const offer = await this.prisma.p2POffer.findUnique({ where: { id: dto.offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (!offer.isOnline) throw new BadRequestException('Offer is no longer available');
    if (offer.traderId === userId) throw new BadRequestException('You cannot trade against your own offer');

    const amount = this.decimal(dto.amount, 'amount');
    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');
    if (amount.lt(offer.availableAmountMin) || amount.gt(offer.availableAmountMax)) throw new BadRequestException('Trade amount is outside the offer crypto limits');
    const fiatAmount = amount.mul(offer.pricePerCoin);
    if (fiatAmount.lt(offer.limitFiatMin) || fiatAmount.gt(offer.limitFiatMax)) throw new BadRequestException('Trade amount is outside the offer fiat limits');

    const expiresAt = new Date(Date.now() + offer.paymentWindowMinutes * 60_000);
    return this.prisma.p2PTrade.create({
      data: {
        offerId: offer.id,
        makerId: offer.traderId,
        takerId: userId,
        type: offer.type,
        cryptoSymbol: offer.cryptoSymbol,
        fiatCurrency: offer.fiatCurrency,
        pricePerCoin: offer.pricePerCoin,
        cryptoAmount: amount,
        fiatAmount,
        paymentMethods: offer.paymentMethods,
        status: P2PTradeStatus.AWAITING_PAYMENT,
        expiresAt,
      },
    });
  }

  async getMyTrades(userId: string) {
    await this.prisma.p2PTrade.updateMany({
      where: { status: P2PTradeStatus.AWAITING_PAYMENT, expiresAt: { lt: new Date() } },
      data: { status: P2PTradeStatus.EXPIRED },
    });
    return this.prisma.p2PTrade.findMany({
      where: { OR: [{ makerId: userId }, { takerId: userId }] },
      orderBy: { createdAt: 'desc' },
    });
  }
}
