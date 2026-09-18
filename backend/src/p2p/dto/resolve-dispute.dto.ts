import { IsIn, IsString, Length } from 'class-validator';
export class ResolveDisputeDto {
  @IsIn(['BUYER','SELLER'])
  outcome: 'BUYER'|'SELLER';

  @IsString()
  @Length(10, 1000)
  reason: string;
}
