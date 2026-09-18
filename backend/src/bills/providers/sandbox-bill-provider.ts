import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillProvider, BillProviderRequest, BillProviderSubmission, BillProviderWebhook } from './bill-provider';

@Injectable()
export class SandboxBillProvider extends BillProvider {
  constructor(private readonly config: ConfigService) { super(); }

  async submit(request: BillProviderRequest): Promise<BillProviderSubmission> {
    return { providerReference: `sandbox-${request.paymentId}`, status: 'PROCESSING' };
  }

  verifyWebhook(rawBody: Buffer, signature: string | undefined): boolean {
    const secret=this.config.get<string>('BILL_PROVIDER_WEBHOOK_SECRET');
    if(!secret||!signature) return false;
    const expected=createHmac('sha256',secret).update(rawBody).digest('hex');
    const supplied=signature.replace(/^sha256=/,'');
    if(expected.length!==supplied.length) return false;
    return timingSafeEqual(Buffer.from(expected,'utf8'),Buffer.from(supplied,'utf8'));
  }

  parseWebhook(rawBody: Buffer): BillProviderWebhook {
    const body=JSON.parse(rawBody.toString('utf8'));
    if(!body.paymentId||!body.providerReference||!['COMPLETED','FAILED'].includes(body.status)) throw new Error('Invalid provider webhook payload');
    return {paymentId:String(body.paymentId),providerReference:String(body.providerReference),status:body.status,failureReason:body.failureReason?String(body.failureReason):undefined};
  }
}
