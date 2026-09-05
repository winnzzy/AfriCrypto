import { Controller, Get, Param } from '@nestjs/common';
import { MarketService } from './market.service';

// Protected by the global JwtAuthGuard (see AppModule) — no per-route guard needed.
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('trend/:cryptoSymbol')
  getTrend(@Param('cryptoSymbol') cryptoSymbol: string) {
    return this.marketService.getTrendExplanation(cryptoSymbol);
  }
}
