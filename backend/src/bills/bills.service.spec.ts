import { BadRequestException } from '@nestjs/common';
import { Prisma, TransactionStatus } from '@prisma/client';
import { BillsService } from './bills.service';

const d=(v:string)=>new Prisma.Decimal(v);

describe('BillsService financial controls',()=>{
  let prisma:any, transactions:any, provider:any, service:BillsService;
  beforeEach(()=>{
    prisma={
      billPayment:{findUnique:jest.fn(),create:jest.fn(),update:jest.fn(),updateMany:jest.fn(),findFirst:jest.fn()},
      biller:{findUnique:jest.fn()},
      fiatAsset:{updateMany:jest.fn(),update:jest.fn()},
      cryptoAsset:{findUnique:jest.fn(),updateMany:jest.fn(),update:jest.fn()},
      transaction:{update:jest.fn()},
      billWebhookEvent:{create:jest.fn(),update:jest.fn(),findUnique:jest.fn()},
    };
    prisma.$transaction=jest.fn(async(cb:any)=>cb(prisma));
    transactions={create:jest.fn(),findOne:jest.fn()};
    provider={submit:jest.fn(),verifyWebhook:jest.fn(),parseWebhook:jest.fn(),getStatus:jest.fn()};
    service=new BillsService(prisma,transactions,provider);
  });

  const biller={id:'mtn',name:'MTN',country:'Nigeria',fiatCurrency:'NGN',paymentAssetSymbols:['NGN','USDT'],fields:[{id:'amount',label:'Amount',required:true}],fixedAmount:null,minAmount:d('50'),maxAmount:d('10000')};

  it('rejects crypto-funded bills until trusted FX exists',async()=>{
    prisma.billPayment.findUnique.mockResolvedValue(null); prisma.biller.findUnique.mockResolvedValue(biller);
    await expect(service.payBill('u1',{billerId:'mtn',paymentAssetSymbol:'USDT',details:{amount:'500'},idempotencyKey:'attempt-12345'})).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.cryptoAsset.updateMany).not.toHaveBeenCalled();
  });

  it('uses biller fiat currency and leaves provider submission processing',async()=>{
    prisma.billPayment.findUnique.mockResolvedValue(null); prisma.biller.findUnique.mockResolvedValue(biller);
    prisma.fiatAsset.updateMany.mockResolvedValue({count:1});
    prisma.billPayment.create.mockResolvedValue({id:'bp1'});
    transactions.create.mockResolvedValue({id:'tx1'});
    prisma.billPayment.update.mockResolvedValue({});
    provider.submit.mockResolvedValue({providerReference:'ref1',status:'PROCESSING'});
    transactions.findOne.mockResolvedValue({id:'tx1',status:TransactionStatus.PENDING});
    await service.payBill('u1',{billerId:'mtn',paymentAssetSymbol:'NGN',details:{amount:'500'},idempotencyKey:'attempt-12345'});
    expect(prisma.billPayment.create).toHaveBeenCalledWith({data:expect.objectContaining({fiatCurrency:'NGN',amountFiat:d('500')})});
    expect(provider.submit).toHaveBeenCalledWith(expect.objectContaining({fiatCurrency:'NGN',amountFiat:'500'}));
  });

  it('keeps a timed-out provider submission processing for later reconciliation',async()=>{
    prisma.billPayment.findUnique.mockResolvedValue(null); prisma.biller.findUnique.mockResolvedValue(biller);
    prisma.fiatAsset.updateMany.mockResolvedValue({count:1}); prisma.billPayment.create.mockResolvedValue({id:'bp1'});
    transactions.create.mockResolvedValue({id:'tx1'}); prisma.billPayment.update.mockResolvedValue({});
    provider.submit.mockRejectedValue(new Error('provider timeout'));
    transactions.findOne.mockResolvedValue({id:'tx1',status:TransactionStatus.PENDING});
    await expect(service.payBill('u1',{billerId:'mtn',paymentAssetSymbol:'NGN',details:{amount:'500'},idempotencyKey:'attempt-timeout'})).resolves.toEqual({id:'tx1',status:TransactionStatus.PENDING});
    expect(prisma.billPayment.update).toHaveBeenCalledTimes(1);
  });

  it('surfaces provider-reference persistence failures after provider acknowledgement',async()=>{
    prisma.billPayment.findUnique.mockResolvedValue(null); prisma.biller.findUnique.mockResolvedValue(biller);
    prisma.fiatAsset.updateMany.mockResolvedValue({count:1}); prisma.billPayment.create.mockResolvedValue({id:'bp1'});
    transactions.create.mockResolvedValue({id:'tx1'});
    prisma.billPayment.update.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('database write failed'));
    provider.submit.mockResolvedValue({providerReference:'ref1',status:'PROCESSING'});
    await expect(service.payBill('u1',{billerId:'mtn',paymentAssetSymbol:'NGN',details:{amount:'500'},idempotencyKey:'attempt-db-fail'})).rejects.toThrow('database write failed');
  });

  it('rejects unsupported cross-currency fiat settlement',async()=>{
    const crossCurrency={...biller,paymentAssetSymbols:['NGN','KES']};
    prisma.billPayment.findUnique.mockResolvedValue(null); prisma.biller.findUnique.mockResolvedValue(crossCurrency);
    await expect(service.payBill('u1',{billerId:'mtn',paymentAssetSymbol:'KES',details:{amount:'500'},idempotencyKey:'attempt-12345'})).rejects.toThrow('Cross-currency fiat bill settlement is not supported');
    expect(prisma.fiatAsset.updateMany).not.toHaveBeenCalled();
  });

  it('retries a recorded but unprocessed provider webhook',async()=>{
    const duplicate=new Prisma.PrismaClientKnownRequestError('duplicate',{code:'P2002',clientVersion:'5.22.0'});
    prisma.billWebhookEvent.create.mockRejectedValue(duplicate);
    prisma.billWebhookEvent.findUnique.mockResolvedValue({processedAt:null});
    prisma.billWebhookEvent.update.mockResolvedValue({});
    provider.verifyWebhook.mockReturnValue(true);
    provider.parseWebhook.mockReturnValue({paymentId:'bp1',providerReference:'ref1',status:'COMPLETED'});
    prisma.billPayment.findUnique.mockResolvedValue({id:'bp1',providerReference:'ref1',status:TransactionStatus.PROCESSING,transactionId:'tx1'});
    prisma.billPayment.updateMany.mockResolvedValue({count:1});
    prisma.transaction.update.mockResolvedValue({});
    const complete=jest.spyOn(service,'completePayment');
    await service.handleProviderWebhook(Buffer.from('payload'),'sig');
    expect(complete).toHaveBeenCalledWith('bp1','ref1');
    expect(prisma.billWebhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({where:expect.any(Object),data:{processedAt:expect.any(Date)}}));
  });

  it('does not reprocess an already processed duplicate webhook',async()=>{
    const duplicate=new Prisma.PrismaClientKnownRequestError('duplicate',{code:'P2002',clientVersion:'5.22.0'});
    prisma.billWebhookEvent.create.mockRejectedValue(duplicate);
    prisma.billWebhookEvent.findUnique.mockResolvedValue({processedAt:new Date()});
    provider.verifyWebhook.mockReturnValue(true);
    provider.parseWebhook.mockReturnValue({paymentId:'bp1',providerReference:'ref1',status:'COMPLETED'});
    prisma.billPayment.findUnique.mockResolvedValue({id:'bp1',providerReference:'ref1'});
    await expect(service.handleProviderWebhook(Buffer.from('payload'),'sig')).resolves.toEqual({received:true,duplicate:true});
    expect(prisma.billPayment.updateMany).not.toHaveBeenCalled();
  });

  it('reverses a failed fiat payment exactly once',async()=>{
    const payment={id:'bp1',userId:'u1',paymentAssetSymbol:'NGN',paymentAmount:d('500'),status:TransactionStatus.PROCESSING,transactionId:'tx1'};
    prisma.billPayment.findUnique.mockResolvedValue(payment); prisma.billPayment.updateMany.mockResolvedValue({count:1});
    prisma.fiatAsset.update.mockResolvedValue({}); prisma.transaction.update.mockResolvedValue({});
    prisma.billPayment.update.mockResolvedValue({...payment,status:TransactionStatus.REVERSED});
    await service.failAndReversePayment('bp1','provider failed');
    expect(prisma.fiatAsset.update).toHaveBeenCalledWith({where:{userId_currencyCode:{userId:'u1',currencyCode:'NGN'}},data:{balance:{increment:d('500')}}});
  });
});
