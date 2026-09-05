import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillsService } from './bills.service';
import { PayBillDto } from './dto/pay-bill.dto';

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

  @Post('pay')
  payBill(@CurrentUser('userId') userId: string, @Body() dto: PayBillDto) {
    return this.billsService.payBill(userId, dto);
  }
}
