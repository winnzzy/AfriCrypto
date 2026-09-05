import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { P2POffer, P2PTradeType, TransactionStatus, TransactionType, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService, TransactionDto } from '../transactions/transactions.service';
import { QueryOffersDto } from './dto/query-offers.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { InitiateTradeDto } from './dto/initiate-trade.dto';

type OfferWithTrader = P2POffer & { trader: User };

// Shape matches P2POffer from the frontend's types.ts. Ranged display
// strings (availableAmountCrypto, limitFiat) are composed here from the
// stored min/max numerics.
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

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
      where: {
        cryptoSymbol: query.cryptoSymbol,
        fiatCurrency: query.fiatCurrency,
        type: query.type,
      },
      include: { trader: true },
      orderBy: { createdAt: 'desc' },
    });
    return offers.map((o) => this.toDto(o));
  }

  async createOffer(traderId: string, dto: CreateOfferDto): Promise<P2POfferDto> {
    const offer = await this.prisma.p2POffer.create({
      data: { traderId, ...dto },
      include: { trader: true },
    });
    return this.toDto(offer);
  }

  async initiateTrade(userId: string, dto: InitiateTradeDto): Promise<TransactionDto> {
    const offer = await this.prisma.p2POffer.findUnique({ where: { id: dto.offerId } });
    if (!offer) throw new NotFoundException('Offer not found');

    const amount = Number(dto.amount);
    if (!(amount > 0)) throw new BadRequestException('Amount must be greater than zero');

    const fiatAmount = amount * Number(offer.pricePerCoin);
    const type = offer.type === P2PTradeType.BUY ? TransactionType.P2P_BUY : TransactionType.P2P_SELL;

    // Settlement (escrow, balance movement, offer status) is intentionally
    // out of scope here — this records the trade as pending, matching how
    // the mock layer behaved.
    return this.transactionsService.create({
      userId,
      type,
      cryptoSymbol: offer.cryptoSymbol,
      cryptoAmount: amount,
      fiatAmount,
      fiatCurrency: offer.fiatCurrency,
      status: TransactionStatus.PENDING,
      description: `${type === TransactionType.P2P_BUY ? 'Buying' : 'Selling'} ${offer.cryptoSymbol} via P2P`,
    });
  }
}
