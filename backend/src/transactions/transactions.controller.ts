import { Controller, Get, NotFoundException, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

// Protected by the global JwtAuthGuard (see AppModule) — no per-route guard needed.
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Response body stays a plain Transaction[] (matches the frontend's existing
  // fetchTransactionHistory contract) — pagination metadata rides on response
  // headers instead, so this is a drop-in swap for older callers and richer
  // for new ones.
  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: QueryTransactionsDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { transactions, total, page, limit } = await this.transactionsService.findAllForUser(userId, query);
    res.set({
      'X-Total-Count': total.toString(),
      'X-Page': page.toString(),
      'X-Limit': limit.toString(),
      'X-Total-Pages': Math.max(1, Math.ceil(total / limit)).toString(),
    });
    return transactions;
  }

  @Get(':id')
  async findOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    const transaction = await this.transactionsService.findOne(userId, id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }
}
