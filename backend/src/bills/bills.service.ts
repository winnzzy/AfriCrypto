import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService, TransactionDto } from '../transactions/transactions.service';
import { SUPPORTED_CRYPTO_SYMBOLS } from '../common/default-assets';
import { PayBillDto } from './dto/pay-bill.dto';
import { BillProvider } from './providers/bill-provider';

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService, private readonly transactionsService: TransactionsService, private readonly provider: BillProvider) {}

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

  private async requireTransaction(userId:string,id:string):Promise<TransactionDto>{
    const transaction=await this.transactionsService.findOne(userId,id);
    if(!transaction) throw new NotFoundException('Bill payment transaction not found');
    return transaction;
  }

  async payBill(userId:string,dto:PayBillDto):Promise<TransactionDto>{
    const existing=await this.prisma.billPayment.findUnique({where:{userId_idempotencyKey:{userId,idempotencyKey:dto.idempotencyKey}}});
    if(existing?.transactionId) return this.requireTransaction(userId,existing.transactionId);
    if(existing) throw new BadRequestException('This bill payment is already being processed');

    const biller=await this.prisma.biller.findUnique({where:{id:dto.billerId}}); if(!biller) throw new NotFoundException('Biller not found');
    if(!biller.paymentAssetSymbols.includes(dto.paymentAssetSymbol)) throw new BadRequestException('Payment asset is not supported by this biller');
    this.validateDetails(biller,dto.details);
    const amountFiat=this.billAmount(biller,dto.details);
    const isCrypto=SUPPORTED_CRYPTO_SYMBOLS.includes(dto.paymentAssetSymbol);
    if(isCrypto) throw new BadRequestException('Crypto bill settlement is temporarily unavailable until a trusted fiat FX quote service is configured');

    const transaction=await this.prisma.$transaction(async tx=>{
      let paymentAmount=amountFiat, cryptoAmount=new Prisma.Decimal(0);
      if(isCrypto){
        const asset=await tx.cryptoAsset.findUnique({where:{userId_symbol:{userId,symbol:dto.paymentAssetSymbol}}}); if(!asset) throw new NotFoundException(`No ${dto.paymentAssetSymbol} balance for this user`);
        if(asset.price.lte(0)) throw new BadRequestException(`No trusted server price is available for ${dto.paymentAssetSymbol}`);
        paymentAmount=amountFiat.div(asset.price);
        const debit=await tx.cryptoAsset.updateMany({where:{id:asset.id,balance:{gte:paymentAmount}},data:{balance:{decrement:paymentAmount}}}); if(debit.count!==1) throw new BadRequestException(`Insufficient ${dto.paymentAssetSymbol} balance`);
        cryptoAmount=paymentAmount;
      }else{
        const debit=await tx.fiatAsset.updateMany({where:{userId,currencyCode:dto.paymentAssetSymbol,balance:{gte:amountFiat}},data:{balance:{decrement:amountFiat}}}); if(debit.count!==1) throw new BadRequestException(`Insufficient or unavailable ${dto.paymentAssetSymbol} balance`);
      }
      const record=await tx.billPayment.create({data:{userId,billerId:biller.id,idempotencyKey:dto.idempotencyKey,paymentAssetSymbol:dto.paymentAssetSymbol,amountFiat,fiatCurrency:biller.fiatCurrency,paymentAmount,details:dto.details,status:TransactionStatus.PENDING}});
      const transaction=await this.transactionsService.create({userId,type:TransactionType.BILL_PAYMENT,cryptoSymbol:isCrypto?dto.paymentAssetSymbol:'',cryptoAmount:cryptoAmount.toString(),status:TransactionStatus.PENDING,fiatAmount:amountFiat.toString(),fiatCurrency:biller.fiatCurrency,description:`Paid ${biller.name}`,billerName:biller.name,billDetails:dto.details},tx);
      await tx.billPayment.update({where:{id:record.id},data:{transactionId:transaction.id,status:TransactionStatus.PROCESSING,processingAt:new Date()}});
      return {transaction,paymentId:record.id};
    });
    try {
      const submission=await this.provider.submit({paymentId:transaction.paymentId,billerId:biller.id,amountFiat:amountFiat.toString(),fiatCurrency:biller.fiatCurrency,details:dto.details});
      await this.prisma.billPayment.update({where:{id:transaction.paymentId},data:{providerReference:submission.providerReference}});
      if(submission.status==='COMPLETED') await this.completePayment(transaction.paymentId,submission.providerReference);
      if(submission.status==='FAILED') await this.failAndReversePayment(transaction.paymentId,submission.failureReason||'Provider rejected payment');
    } catch {
      // Keep PROCESSING: reconciliation/webhook can safely resolve an uncertain provider response.
    }
    return this.requireTransaction(userId,transaction.transaction.id);
  }

  async handleProviderWebhook(rawBody:Buffer,signature:string|undefined){
    if(!this.provider.verifyWebhook(rawBody,signature)) throw new BadRequestException('Invalid provider webhook signature');
    let event; try{ event=this.provider.parseWebhook(rawBody); }catch{ throw new BadRequestException('Invalid provider webhook payload'); }
    const payment=await this.prisma.billPayment.findUnique({where:{id:event.paymentId}});
    if(!payment) throw new NotFoundException('Bill payment not found');
    if(payment.providerReference&&payment.providerReference!==event.providerReference) throw new BadRequestException('Provider reference mismatch');
    const payloadHash=createHash('sha256').update(rawBody).digest('hex');
    const eventKey=createHash('sha256').update(`${event.paymentId}:${event.providerReference}:${event.status}:${payloadHash}`).digest('hex');
    try{ await this.prisma.billWebhookEvent.create({data:{eventKey,paymentId:event.paymentId,providerReference:event.providerReference,status:event.status,payloadHash}}); }
    catch(e){ if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002') return {received:true,duplicate:true}; throw e; }
    let result;
    if(event.status==='COMPLETED') result=await this.completePayment(event.paymentId,event.providerReference);
    else result=await this.failAndReversePayment(event.paymentId,event.failureReason||'Provider reported payment failure');
    await this.prisma.billWebhookEvent.update({where:{eventKey},data:{processedAt:new Date()}});
    return result;
  }

  async reconcilePayment(userId:string,id:string){
    const payment=await this.prisma.billPayment.findFirst({where:{id,userId}});
    if(!payment) throw new NotFoundException('Bill payment not found');
    if(payment.status!==TransactionStatus.PROCESSING||!payment.providerReference) return payment;
    const result=await this.provider.getStatus(payment.providerReference);
    if(result.status==='COMPLETED') return this.completePayment(id,payment.providerReference);
    if(result.status==='FAILED') return this.failAndReversePayment(id,result.failureReason||'Provider reconciliation reported failure');
    return payment;
  }

  async getPayment(userId:string,id:string){
    const payment=await this.prisma.billPayment.findFirst({where:{id,userId}});
    if(!payment) throw new NotFoundException('Bill payment not found');
    return payment;
  }

  async completePayment(id:string,providerReference:string){
    return this.prisma.$transaction(async tx=>{
      const payment=await tx.billPayment.findUnique({where:{id}});
      if(!payment) throw new NotFoundException('Bill payment not found');
      if(payment.status===TransactionStatus.COMPLETED) return payment;
      if(payment.status!==TransactionStatus.PROCESSING) throw new BadRequestException('Bill payment is not awaiting provider completion');
      const claimed=await tx.billPayment.updateMany({where:{id,status:TransactionStatus.PROCESSING},data:{status:TransactionStatus.COMPLETED,providerReference,completedAt:new Date()}});
      if(claimed.count!==1) return tx.billPayment.findUnique({where:{id}});
      if(payment.transactionId) await tx.transaction.update({where:{id:payment.transactionId},data:{status:TransactionStatus.COMPLETED}});
      return tx.billPayment.findUnique({where:{id}});
    });
  }

  async failAndReversePayment(id:string,reason:string){
    return this.prisma.$transaction(async tx=>{
      const payment=await tx.billPayment.findUnique({where:{id}});
      if(!payment) throw new NotFoundException('Bill payment not found');
      if(payment.status===TransactionStatus.REVERSED) return payment;
      if(payment.status!==TransactionStatus.PROCESSING) throw new BadRequestException('Bill payment cannot be reversed from its current state');
      const claimed=await tx.billPayment.updateMany({where:{id,status:TransactionStatus.PROCESSING},data:{status:TransactionStatus.FAILED,failureReason:reason,failedAt:new Date()}});
      if(claimed.count!==1) return tx.billPayment.findUnique({where:{id}});
      if(SUPPORTED_CRYPTO_SYMBOLS.includes(payment.paymentAssetSymbol)){
        await tx.cryptoAsset.update({where:{userId_symbol:{userId:payment.userId,symbol:payment.paymentAssetSymbol}},data:{balance:{increment:payment.paymentAmount}}});
      }else{
        await tx.fiatAsset.update({where:{userId_currencyCode:{userId:payment.userId,currencyCode:payment.paymentAssetSymbol}},data:{balance:{increment:payment.paymentAmount}}});
      }
      if(payment.transactionId) await tx.transaction.update({where:{id:payment.transactionId},data:{status:TransactionStatus.REVERSED,description:'Bill payment failed and funds were returned'}});
      return tx.billPayment.update({where:{id},data:{status:TransactionStatus.REVERSED,reversedAt:new Date()}});
    });
  }
}
