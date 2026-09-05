import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletsService } from './wallets.service';
import { SendCryptoDto } from './dto/send-crypto.dto';

// Protected by the global JwtAuthGuard (see AppModule) — no per-route guard needed.
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  getWallet(@CurrentUser('userId') userId: string) {
    return this.walletsService.getWalletData(userId);
  }

  @Post('send')
  sendCrypto(@CurrentUser('userId') userId: string, @Body() dto: SendCryptoDto) {
    return this.walletsService.sendCrypto(userId, dto);
  }

  @Get('receive/:cryptoSymbol')
  getReceiveAddress(@CurrentUser('userId') userId: string, @Param('cryptoSymbol') cryptoSymbol: string) {
    return this.walletsService.getReceiveAddress(userId, cryptoSymbol);
  }
}
