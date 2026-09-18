import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { P2PTradeStatus, P2PTradeType, Prisma } from '@prisma/client';
import { P2pService } from './p2p.service';

const d = (v: string) => new Prisma.Decimal(v);

function offer(type = P2PTradeType.SELL) {
  return {
    id: 'offer-1', traderId: 'maker', type, cryptoSymbol: 'USDT', fiatCurrency: 'NGN',
    pricePerCoin: d('1500'), availableAmountMin: d('10'), availableAmountMax: d('100'),
    limitFiatMin: d('15000'), limitFiatMax: d('150000'), paymentMethods: ['Bank'],
    isOnline: true, paymentWindowMinutes: 15,
  };
}

function trade(status = P2PTradeStatus.AWAITING_PAYMENT, type = P2PTradeType.SELL) {
  return {
    id: 'trade-1', makerId: 'maker', takerId: 'taker', type, cryptoSymbol: 'USDT',
    cryptoAmount: d('20'), fiatAmount: d('30000'), fiatCurrency: 'NGN', status,
    expiresAt: new Date(Date.now() + 60000), escrowFundedAt: new Date(), escrowReleasedAt: null,
  };
}

describe('P2pService escrow lifecycle', () => {
  let prisma: any;
  let service: P2pService;

  beforeEach(() => {
    prisma = {
      p2POffer: { findUnique: jest.fn() },
      p2PTrade: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
      cryptoAsset: { updateMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      transaction: { create: jest.fn() },
      user: { update: jest.fn() },
    };
    prisma.$transaction = jest.fn(async (cb: any) => cb(prisma));
    service = new P2pService(prisma);
  });

  it('reserves maker crypto for a SELL offer', async () => {
    prisma.p2POffer.findUnique.mockResolvedValue(offer(P2PTradeType.SELL));
    prisma.cryptoAsset.updateMany.mockResolvedValue({ count: 1 });
    prisma.p2PTrade.create.mockImplementation(({ data }: any) => data);
    await service.initiateTrade('taker', { offerId: 'offer-1', amount: '20' });
    expect(prisma.cryptoAsset.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'maker', symbol: 'USDT' }),
      data: { balance: { decrement: d('20') } },
    }));
  });

  it('reserves taker crypto for a BUY offer', async () => {
    prisma.p2POffer.findUnique.mockResolvedValue(offer(P2PTradeType.BUY));
    prisma.cryptoAsset.updateMany.mockResolvedValue({ count: 1 });
    prisma.p2PTrade.create.mockImplementation(({ data }: any) => data);
    await service.initiateTrade('taker', { offerId: 'offer-1', amount: '20' });
    expect(prisma.cryptoAsset.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'taker', symbol: 'USDT' }),
    }));
  });

  it('rejects escrow when seller balance is insufficient', async () => {
    prisma.p2POffer.findUnique.mockResolvedValue(offer());
    prisma.cryptoAsset.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.initiateTrade('taker', { offerId: 'offer-1', amount: '20' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.p2PTrade.create).not.toHaveBeenCalled();
  });

  it('allows only the buyer to mark payment', async () => {
    prisma.p2PTrade.findUnique.mockResolvedValue(trade());
    await expect(service.markPayment('maker', 'trade-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('claims cancellation once before refunding escrow', async () => {
    prisma.p2PTrade.findUnique.mockResolvedValue(trade());
    prisma.p2PTrade.updateMany.mockResolvedValue({ count: 1 });
    prisma.cryptoAsset.updateMany.mockResolvedValue({ count: 1 });
    await service.cancelTrade('taker', 'trade-1');
    expect(prisma.p2PTrade.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: P2PTradeStatus.AWAITING_PAYMENT, escrowReleasedAt: null }),
    }));
    expect(prisma.cryptoAsset.updateMany).toHaveBeenCalled();
  });

  it('rejects a second cancellation after another request claims the trade', async () => {
    prisma.p2PTrade.findUnique.mockResolvedValue(trade());
    prisma.p2PTrade.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.cancelTrade('taker', 'trade-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.cryptoAsset.updateMany).not.toHaveBeenCalled();
  });

  it('settles escrow once and credits the buyer', async () => {
    prisma.p2PTrade.findUnique.mockResolvedValue(trade(P2PTradeStatus.PAYMENT_MARKED));
    prisma.p2PTrade.updateMany.mockResolvedValue({ count: 1 });
    prisma.cryptoAsset.findUnique.mockResolvedValue({ id: 'buyer-wallet' });
    prisma.cryptoAsset.update.mockResolvedValue({});
    prisma.transaction.create.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});
    await service.releaseCrypto('maker', 'trade-1');
    expect(prisma.cryptoAsset.update).toHaveBeenCalledWith({
      where: { id: 'buyer-wallet' }, data: { balance: { increment: d('20') } },
    });
    expect(prisma.transaction.create).toHaveBeenCalledTimes(2);
  });

  it('prevents duplicate release when settlement was already claimed', async () => {
    prisma.p2PTrade.findUnique.mockResolvedValue(trade(P2PTradeStatus.PAYMENT_MARKED));
    prisma.p2PTrade.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.releaseCrypto('maker', 'trade-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.cryptoAsset.update).not.toHaveBeenCalled();
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });
});
