import { Module } from '@nestjs/common';
import { P2pService } from './p2p.service';
import { P2pController } from './p2p.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  providers: [P2pService],
  controllers: [P2pController],
})
export class P2pModule {}
