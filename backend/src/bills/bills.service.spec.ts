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
      billWebhookEvent:{create:jest.fn(),update:jest.fn()},
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

  it('reverses a failed fiat payment exactly once',async()=>{
    const payment={id:'bp1',userId:'u1',paymentAssetSymbol:'NGN',paymentAmount:d('500'),status:TransactionStatus.PROCESSING,transactionId:'tx1'};
    prisma.billPayment.findUnique.mockResolvedValue(payment); prisma.billPayment.updateMany.mockResolvedValue({count:1});
    prisma.fiatAsset.update.mockResolvedValue({}); prisma.transaction.update.mockResolvedValue({});
    prisma.billPayment.update.mockResolvedValue({...payment,status:TransactionStatus.REVERSED});
    await service.failAndReversePayment('bp1','provider failed');
    expect(prisma.fiatAsset.update).toHaveBeenCalledWith({where:{userId_currencyCode:{userId:'u1',currencyCode:'NGN'}},data:{balance:{increment:d('500')}}});
  });
});
