import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { P2pService } from './p2p.service';
import { QueryOffersDto } from './dto/query-offers.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { InitiateTradeDto } from './dto/initiate-trade.dto';

@Controller('p2p')
export class P2pController {
  constructor(private readonly p2pService: P2pService) {}

  @Get('offers')
  findOffers(@Query() query: QueryOffersDto) { return this.p2pService.findOffers(query); }

  @Post('offers')
  createOffer(@CurrentUser('userId') userId: string, @Body() dto: CreateOfferDto) { return this.p2pService.createOffer(userId, dto); }

  @Get('trades')
  getMyTrades(@CurrentUser('userId') userId: string) { return this.p2pService.getMyTrades(userId); }

  @Post('trade')
  initiateTrade(@CurrentUser('userId') userId: string, @Body() dto: InitiateTradeDto) { return this.p2pService.initiateTrade(userId, dto); }

  @Post('trades/:id/payment')
  markPayment(@CurrentUser('userId') userId: string, @Param('id') tradeId: string) { return this.p2pService.markPayment(userId, tradeId); }

  @Post('trades/:id/cancel')
  cancelTrade(@CurrentUser('userId') userId: string, @Param('id') tradeId: string) { return this.p2pService.cancelTrade(userId, tradeId); }

  @Post('trades/:id/dispute')
  disputeTrade(@CurrentUser('userId') userId: string, @Param('id') tradeId: string) { return this.p2pService.disputeTrade(userId, tradeId); }
}
