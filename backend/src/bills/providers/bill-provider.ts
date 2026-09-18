export type BillProviderStatus = 'COMPLETED' | 'FAILED';

export interface BillProviderRequest {
  paymentId: string;
  billerId: string;
  amountFiat: string;
  fiatCurrency: string;
  details: Record<string, string>;
}

export interface BillProviderSubmission {
  providerReference: string;
  status: 'PROCESSING' | BillProviderStatus;
  failureReason?: string;
}

export interface BillProviderWebhook {
  paymentId: string;
  providerReference: string;
  status: BillProviderStatus;
  failureReason?: string;
}

export abstract class BillProvider {
  abstract submit(request: BillProviderRequest): Promise<BillProviderSubmission>;
  abstract verifyWebhook(rawBody: Buffer, signature: string | undefined): boolean;
  abstract parseWebhook(rawBody: Buffer): BillProviderWebhook;
  abstract getStatus(providerReference: string): Promise<BillProviderSubmission>;
}
