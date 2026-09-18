import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillsService } from './bills.service';
import { PayBillDto } from './dto/pay-bill.dto';
import { Public } from '../auth/decorators/public.decorator';

// Protected by the global JwtAuthGuard (see AppModule) — no per-route guard needed.
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get('categories/:country')
  findCategories(@Param('country') country: string) {
    return this.billsService.findCategories(country);
  }

  @Get('billers/:country/:categoryId')
  findBillers(@Param('country') country: string, @Param('categoryId') categoryId: string) {
    return this.billsService.findBillers(country, categoryId);
  }

  @Get('payments/:id')
  getPayment(@CurrentUser('userId') userId:string,@Param('id') id:string) {
    return this.billsService.getPayment(userId,id);
  }

  @Public()
  @Post('provider/webhook')
  providerWebhook(@Req() req:any,@Headers('x-bill-signature') signature?:string) {
    if(!req.rawBody) throw new BadRequestException('Raw webhook body is required');
    return this.billsService.handleProviderWebhook(req.rawBody,signature);
  }

  @Post('pay')
  payBill(@CurrentUser('userId') userId: string, @Body() dto: PayBillDto) {
    return this.billsService.payBill(userId, dto);
  }
}
