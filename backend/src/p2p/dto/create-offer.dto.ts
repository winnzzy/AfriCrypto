import { IsArray, IsBoolean, IsEnum, IsInt, IsNumberString, IsOptional, IsString, Min } from 'class-validator';
import { P2PTradeType } from '@prisma/client';

export class CreateOfferDto {
  @IsEnum(P2PTradeType)
  type: P2PTradeType;

  @IsString()
  cryptoSymbol: string;

  @IsString()
  fiatCurrency: string;

  @IsNumberString()
  pricePerCoin: string;

  @IsNumberString()
  availableAmountMin: string;

  @IsNumberString()
  availableAmountMax: string;

  @IsNumberString()
  limitFiatMin: string;

  @IsNumberString()
  limitFiatMax: string;

  @IsArray()
  @IsString({ each: true })
  paymentMethods: string[];

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  paymentWindowMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  avgReleaseTimeMinutes?: number;
}
