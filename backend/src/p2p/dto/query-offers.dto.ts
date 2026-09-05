import { IsEnum, IsString } from 'class-validator';
import { P2PTradeType } from '@prisma/client';

export class QueryOffersDto {
  @IsString()
  cryptoSymbol: string;

  @IsString()
  fiatCurrency: string;

  @IsEnum(P2PTradeType)
  type: P2PTradeType;
}
