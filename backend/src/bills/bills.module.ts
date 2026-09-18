import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { BillProvider } from './providers/bill-provider';
import { SandboxBillProvider } from './providers/sandbox-bill-provider';

@Module({
  imports: [TransactionsModule, ConfigModule],
  providers: [BillsService, SandboxBillProvider, { provide: BillProvider, useExisting: SandboxBillProvider }],
  controllers: [BillsController],
})
export class BillsModule {}
