import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class PayBillDto {
  @IsString()
  billerId: string;

  @IsNumber()
  @Min(0)
  amountFiat: number;

  @IsString()
  fiatCurrency: string;

  @IsString()
  paymentAssetSymbol: string;

  @IsNumber()
  @Min(0)
  paymentAmountGross: number;

  @IsObject()
  details: Record<string, string>;

  @IsOptional()
  @IsNumber()
  cryptoToFiatRate?: number;
}
