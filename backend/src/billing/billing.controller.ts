import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private billingService: BillingService) {}

  // Верификация покупки Google
  @Post('verify/google')
  @UseGuards(JwtAuthGuard)
  async verifyGooglePurchase(
    @CurrentUser('userId') userId: string,
    @Body() body: { purchaseToken: string; productId: string },
  ) {
    return this.billingService.verifyGooglePurchase(
      userId,
      body.purchaseToken,
      body.productId,
    );
  }

  // Верификация покупки Apple
  @Post('verify/apple')
  @UseGuards(JwtAuthGuard)
  async verifyApplePurchase(
    @CurrentUser('userId') userId: string,
    @Body() body: { transactionReceipt: string; productId: string },
  ) {
    return this.billingService.verifyApplePurchase(
      userId,
      body.transactionReceipt,
      body.productId,
    );
  }

  // Статус подписки
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionStatus(@CurrentUser('userId') userId: string) {
    return this.billingService.getSubscriptionStatus(userId);
  }

  // Webhook от Google Play
  @Post('webhook/google')
  async handleGoogleWebhook(@Req() req: RawBodyRequest<Request>) {
    this.logger.log('Google webhook received');
    // TODO: Парсинг JWT от Google
    // const notification = JSON.parse(Buffer.from(signedNotification, 'base64').toString());
    // return this.billingService.handleGoogleNotification(notification);
    return { received: true };
  }

  // Webhook от App Store
  @Post('webhook/apple')
  async handleAppleWebhook(@Body() body: any) {
    this.logger.log('Apple webhook received');
    return this.billingService.handleAppleNotification(body);
  }
}
