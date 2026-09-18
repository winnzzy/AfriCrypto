import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService, TransactionDto } from '../transactions/transactions.service';
import { SUPPORTED_CRYPTO_SYMBOLS } from '../common/default-assets';
import { PayBillDto } from './dto/pay-bill.dto';

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService, private readonly transactionsService: TransactionsService) {}

  findCategories(country:string){ return this.prisma.billCategory.findMany({where:{countries:{has:country}}}); }
  async findBillers(country:string,categoryId:string){ const rows=await this.prisma.biller.findMany({where:{country,categoryId}}); return rows.map(b=>({...b,fixedAmount:b.fixedAmount?Number(b.fixedAmount):undefined,minAmount:b.minAmount?Number(b.minAmount):undefined,maxAmount:b.maxAmount?Number(b.maxAmount):undefined})); }

  private billAmount(biller:any,details:Record<string,string>):Prisma.Decimal {
    if(biller.fixedAmount) return biller.fixedAmount;
    const raw=details.amount;
    if(!raw) throw new BadRequestException('Bill amount is required');
    let amount:Prisma.Decimal; try{ amount=new Prisma.Decimal(raw); }catch{ throw new BadRequestException('Invalid bill amount'); }
    if(!amount.isFinite()||amount.lte(0)) throw new BadRequestException('Bill amount must be greater than zero');
    if(biller.minAmount&&amount.lt(biller.minAmount)) throw new BadRequestException('Bill amount is below the biller minimum');
    if(biller.maxAmount&&amount.gt(biller.maxAmount)) throw new BadRequestException('Bill amount exceeds the biller maximum');
    return amount;
  }

  private validateDetails(biller:any,details:Record<string,string>){
    const fields=Array.isArray(biller.fields)?biller.fields:[];
    for(const field of fields){ const value=details[field.id]; if(field.required&&!String(value??'').trim()) throw new BadRequestException(`${field.label} is required`); if(value&&field.validationRegex){ try{ if(!new RegExp(field.validationRegex).test(String(value))) throw new BadRequestException(`${field.label} is invalid`); }catch(e){ if(e instanceof BadRequestException) throw e; } } }
  }

  async payBill(userId:string,dto:PayBillDto):Promise<TransactionDto>{
    const existing=await this.prisma.billPayment.findUnique({where:{userId_idempotencyKey:{userId,idempotencyKey:dto.idempotencyKey}}});
    if(existing?.transactionId) return this.transactionsService.findOne(userId,existing.transactionId);
    if(existing) throw new BadRequestException('This bill payment is already being processed');

    const biller=await this.prisma.biller.findUnique({where:{id:dto.billerId}}); if(!biller) throw new NotFoundException('Biller not found');
    if(!biller.paymentAssetSymbols.includes(dto.paymentAssetSymbol)) throw new BadRequestException('Payment asset is not supported by this biller');
    this.validateDetails(biller,dto.details);
    const amountFiat=this.billAmount(biller,dto.details);
    const isCrypto=SUPPORTED_CRYPTO_SYMBOLS.includes(dto.paymentAssetSymbol);

    return this.prisma.$transaction(async tx=>{
      let paymentAmount=amountFiat, cryptoAmount=new Prisma.Decimal(0);
      if(isCrypto){
        const asset=await tx.cryptoAsset.findUnique({where:{userId_symbol:{userId,symbol:dto.paymentAssetSymbol}}}); if(!asset) throw new NotFoundException(`No ${dto.paymentAssetSymbol} balance for this user`);
        if(asset.price.lte(0)) throw new BadRequestException(`No trusted server price is available for ${dto.paymentAssetSymbol}`);
        paymentAmount=amountFiat.div(asset.price);
        const debit=await tx.cryptoAsset.updateMany({where:{id:asset.id,balance:{gte:paymentAmount}},data:{balance:{decrement:paymentAmount}}}); if(debit.count!==1) throw new BadRequestException(`Insufficient ${dto.paymentAssetSymbol} balance`);
        cryptoAmount=paymentAmount;
      }else{
        if(dto.paymentAssetSymbol!==biller.country && false){} // currency is validated by wallet existence below
        const debit=await tx.fiatAsset.updateMany({where:{userId,currencyCode:dto.paymentAssetSymbol,balance:{gte:amountFiat}},data:{balance:{decrement:amountFiat}}}); if(debit.count!==1) throw new BadRequestException(`Insufficient or unavailable ${dto.paymentAssetSymbol} balance`);
      }
      const record=await tx.billPayment.create({data:{userId,billerId:biller.id,idempotencyKey:dto.idempotencyKey,paymentAssetSymbol:dto.paymentAssetSymbol,amountFiat,fiatCurrency:isCrypto?biller.country:dto.paymentAssetSymbol,paymentAmount,details:dto.details,status:TransactionStatus.PENDING}});
      const transaction=await this.transactionsService.create({userId,type:TransactionType.BILL_PAYMENT,cryptoSymbol:isCrypto?dto.paymentAssetSymbol:'',cryptoAmount,status:TransactionStatus.COMPLETED,fiatAmount:amountFiat,fiatCurrency:isCrypto?biller.country:dto.paymentAssetSymbol,description:`Paid ${biller.name}`,billerName:biller.name,billDetails:dto.details},tx);
      await tx.billPayment.update({where:{id:record.id},data:{transactionId:transaction.id,status:TransactionStatus.COMPLETED}});
      return transaction;
    });
  }
}
