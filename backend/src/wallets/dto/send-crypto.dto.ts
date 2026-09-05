import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class SendCryptoDto {
  @IsString()
  @IsNotEmpty()
  cryptoSymbol: string;

  @IsString()
  @IsNotEmpty()
  recipientAddress: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  memo?: string;
}
