import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { P2pService } from './p2p.service';
import { QueryOffersDto } from './dto/query-offers.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { InitiateTradeDto } from './dto/initiate-trade.dto';

// Protected by the global JwtAuthGuard (see AppModule) — no per-route guard needed.
@Controller('p2p')
export class P2pController {
  constructor(private readonly p2pService: P2pService) {}

  @Get('offers')
  findOffers(@Query() query: QueryOffersDto) {
    return this.p2pService.findOffers(query);
  }

  @Post('offers')
  createOffer(@CurrentUser('userId') userId: string, @Body() dto: CreateOfferDto) {
    return this.p2pService.createOffer(userId, dto);
  }

  @Post('trade')
  initiateTrade(@CurrentUser('userId') userId: string, @Body() dto: InitiateTradeDto) {
    return this.p2pService.initiateTrade(userId, dto);
  }
}
