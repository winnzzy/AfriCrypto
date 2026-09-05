import { IsNumberString, IsString } from 'class-validator';

export class InitiateTradeDto {
  @IsString()
  offerId: string;

  @IsNumberString()
  amount: string;
}
