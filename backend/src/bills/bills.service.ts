import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService, TransactionDto } from '../transactions/transactions.service';
import { SUPPORTED_CRYPTO_SYMBOLS } from '../common/default-assets';
import { PayBillDto } from './dto/pay-bill.dto';

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

  findCategories(country: string) {
    return this.prisma.billCategory.findMany({
      where: { countries: { has: country } },
    });
  }

  async findBillers(country: string, categoryId: string) {
    const billers = await this.prisma.biller.findMany({ where: { country, categoryId } });
    return billers.map((biller) => ({
      ...biller,
      fixedAmount: biller.fixedAmount ? Number(biller.fixedAmount) : undefined,
      minAmount: biller.minAmount ? Number(biller.minAmount) : undefined,
      maxAmount: biller.maxAmount ? Number(biller.maxAmount) : undefined,
    }));
  }

  async payBill(userId: string, dto: PayBillDto): Promise<TransactionDto> {
    const biller = await this.prisma.biller.findUnique({ where: { id: dto.billerId } });
    if (!biller) throw new NotFoundException('Biller not found');

    const isCrypto = SUPPORTED_CRYPTO_SYMBOLS.includes(dto.paymentAssetSymbol);

    return this.prisma.$transaction(async (tx) => {
      let cryptoAmountPaid = 0;

      if (isCrypto) {
        const asset = await tx.cryptoAsset.findUnique({
          where: { userId_symbol: { userId, symbol: dto.paymentAssetSymbol } },
        });
        if (!asset) throw new NotFoundException(`No ${dto.paymentAssetSymbol} balance for this user`);
        if (Number(asset.balance) < dto.paymentAmountGross) {
          throw new BadRequestException(`Insufficient ${dto.paymentAssetSymbol} balance`);
        }
        await tx.cryptoAsset.update({
          where: { id: asset.id },
          data: { balance: { decrement: dto.paymentAmountGross } },
        });
        cryptoAmountPaid = dto.paymentAmountGross;
      } else {
        const asset = await tx.fiatAsset.findUnique({
          where: { userId_currencyCode: { userId, currencyCode: dto.paymentAssetSymbol } },
        });
        if (!asset) throw new NotFoundException(`No ${dto.paymentAssetSymbol} balance for this user`);
        if (Number(asset.balance) < dto.paymentAmountGross) {
          throw new BadRequestException(`Insufficient ${dto.paymentAssetSymbol} balance`);
        }
        await tx.fiatAsset.update({
          where: { id: asset.id },
          data: { balance: { decrement: dto.paymentAmountGross } },
        });
      }

      return this.transactionsService.create(
        {
          userId,
          type: TransactionType.BILL_PAYMENT,
          cryptoSymbol: isCrypto ? dto.paymentAssetSymbol : '',
          cryptoAmount: cryptoAmountPaid,
          fiatAmount: dto.amountFiat,
          fiatCurrency: dto.fiatCurrency,
          status: TransactionStatus.COMPLETED,
          description: `Paid ${biller.name}`,
          billerName: biller.name,
          billDetails: dto.details,
        },
        tx,
      );
    });
  }
}
