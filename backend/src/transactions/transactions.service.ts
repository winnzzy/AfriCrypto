import { Injectable } from '@nestjs/common';
import { Prisma, Transaction, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Accepts either the main PrismaService or the tx client handed to a
// $transaction callback, so callers can create a transaction record as part
// of the same atomic balance update (see WalletsService.sendCrypto).
type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

export interface CreateTransactionInput {
  userId: string;
  type: TransactionType;
  cryptoSymbol: string;
  cryptoAmount: number | string;
  fiatAmount?: number | string;
  fiatCurrency?: string;
  status?: TransactionStatus;
  addressTo?: string;
  addressFrom?: string;
  description?: string;
  billerName?: string;
  billDetails?: Record<string, string>;
}

// Shape matches Transaction from the frontend's types.ts.
export interface TransactionDto {
  id: string;
  type: TransactionType;
  cryptoSymbol: string;
  cryptoAmount: string;
  fiatAmount?: string;
  fiatCurrency?: string;
  status: TransactionStatus;
  timestamp: string;
  addressTo?: string;
  addressFrom?: string;
  description?: string;
  billerName?: string;
  billDetails?: Record<string, string>;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(transaction: Transaction): TransactionDto {
    return {
      id: transaction.id,
      type: transaction.type,
      cryptoSymbol: transaction.cryptoSymbol,
      cryptoAmount: transaction.cryptoAmount.toString(),
      fiatAmount: transaction.fiatAmount?.toString(),
      fiatCurrency: transaction.fiatCurrency ?? undefined,
      status: transaction.status,
      timestamp: transaction.createdAt.toISOString(),
      addressTo: transaction.addressTo ?? undefined,
      addressFrom: transaction.addressFrom ?? undefined,
      description: transaction.description ?? undefined,
      billerName: transaction.billerName ?? undefined,
      billDetails: (transaction.billDetails as Record<string, string> | null) ?? undefined,
    };
  }

  async create(input: CreateTransactionInput, client: PrismaClientOrTx = this.prisma): Promise<TransactionDto> {
    const transaction = await client.transaction.create({
      data: {
        userId: input.userId,
        type: input.type,
        cryptoSymbol: input.cryptoSymbol,
        cryptoAmount: input.cryptoAmount,
        fiatAmount: input.fiatAmount,
        fiatCurrency: input.fiatCurrency,
        status: input.status ?? TransactionStatus.PENDING,
        addressTo: input.addressTo,
        addressFrom: input.addressFrom,
        description: input.description,
        billerName: input.billerName,
        billDetails: input.billDetails as unknown as Prisma.InputJsonValue,
      },
    });
    return this.toDto(transaction);
  }

  async findAllForUser(
    userId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
  ): Promise<{ transactions: TransactionDto[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);
    return { transactions: transactions.map((t) => this.toDto(t)), total, page, limit };
  }

  async findOne(userId: string, id: string): Promise<TransactionDto | null> {
    const transaction = await this.prisma.transaction.findFirst({ where: { id, userId } });
    return transaction ? this.toDto(transaction) : null;
  }

  // Used to move a transaction through its lifecycle (e.g. PENDING -> COMPLETED
  // after simulated settlement). Accepts a tx client so it can participate in
  // the same atomic balance update that created the transaction.
  async updateStatus(
    id: string,
    status: TransactionStatus,
    client: PrismaClientOrTx = this.prisma,
  ): Promise<TransactionDto> {
    const transaction = await client.transaction.update({ where: { id }, data: { status } });
    return this.toDto(transaction);
  }
}
