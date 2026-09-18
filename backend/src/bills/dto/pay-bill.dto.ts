import { IsObject, IsString, Matches } from 'class-validator';

export class PayBillDto {
  @IsString()
  billerId: string;

  @IsString()
  paymentAssetSymbol: string;

  @IsObject()
  details: Record<string, string>;

  @IsString()
  @Matches(/^[A-Za-z0-9._:-]{8,128}$/)
  idempotencyKey: string;
}
