import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubscriptionType } from '@prisma/client';

// SKU для подписок
export const SUBSCRIPTION_SKUS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
} as const;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private prisma: PrismaService) {}

  // Верификация покупки (Google Play)
  async verifyGooglePurchase(userId: string, purchaseToken: string, productId: string) {
    this.logger.log(`Verifying Google purchase for user ${userId}, product ${productId}`);

    // TODO: Реальная верификация через Google Play Developer API
    // Пока используем заглушку для разработки
    const isValid = await this.mockGoogleVerification(purchaseToken, productId);

    if (!isValid) {
      throw new BadRequestException('Purchase verification failed');
    }

    // Определяем длительность подписки по productId
    const months = this.getSubscriptionMonths(productId);

    // Выдаём Premium
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: SubscriptionType.PREMIUM,
        subscriptionExpiresAt: expiresAt,
      },
    });

    // Сохраняем информацию о покупке
    await this.prisma.purchase.create({
      data: {
        userId,
        platform: 'GOOGLE',
        productId,
        purchaseToken,
        transactionId: purchaseToken.substring(0, 50), // Заглушка
        status: 'COMPLETED',
      },
    });

    this.logger.log(`Premium granted to user ${userId} until ${expiresAt}`);

    return {
      success: true,
      subscriptionType: user.subscriptionType,
      expiresAt: user.subscriptionExpiresAt,
    };
  }

  // Верификация покупки (App Store)
  async verifyApplePurchase(userId: string, transactionReceipt: string, productId: string) {
    this.logger.log(`Verifying Apple purchase for user ${userId}, product ${productId}`);

    // TODO: Реальная верификация через App Store Server API
    const isValid = await this.mockAppleVerification(transactionReceipt, productId);

    if (!isValid) {
      throw new BadRequestException('Purchase verification failed');
    }

    const months = this.getSubscriptionMonths(productId);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: SubscriptionType.PREMIUM,
        subscriptionExpiresAt: expiresAt,
      },
    });

    await this.prisma.purchase.create({
      data: {
        userId,
        platform: 'APPLE',
        productId,
        purchaseToken: transactionReceipt.substring(0, 100),
        transactionId: transactionReceipt.substring(0, 50),
        status: 'COMPLETED',
      },
    });

    return {
      success: true,
      subscriptionType: user.subscriptionType,
      expiresAt: user.subscriptionExpiresAt,
    };
  }

  // Webhook от Google (Real-time Developer Notifications)
  async handleGoogleNotification(notification: any) {
    this.logger.log('Received Google notification:', JSON.stringify(notification));

    // TODO: Обработка уведомлений
    // - SUBSCRIPTION_PURCHASED
    // - SUBSCRIPTION_RENEWED
    // - SUBSCRIPTION_CANCELED
    // - SUBSCRIPTION_EXPIRED
  }

  // Webhook от Apple (App Store Server Notifications)
  async handleAppleNotification(notification: any) {
    this.logger.log('Received Apple notification:', JSON.stringify(notification));

    // TODO: Обработка уведомлений
  }

  // Получить текущую подписку пользователя
  async getSubscriptionStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionType: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isActive =
      (user.subscriptionType === SubscriptionType.PREMIUM ||
        user.subscriptionType === SubscriptionType.AMBASSADOR) &&
      (!user.subscriptionExpiresAt || new Date() <= user.subscriptionExpiresAt);

    return {
      subscriptionType: user.subscriptionType,
      expiresAt: user.subscriptionExpiresAt,
      isActive,
    };
  }

  // Определить длительность подписки по productId
  private getSubscriptionMonths(productId: string): number {
    if (productId.includes('yearly') || productId.includes('annual')) {
      return 12;
    }
    return 1; // monthly
  }

  // Заглушка для разработки (потом заменить на реальную верификацию)
  private async mockGoogleVerification(token: string, productId: string): Promise<boolean> {
    // В проде заменить на:
    // const googleapis = require('googleapis');
    // const androidpublisher = googleapis.androidpublisher('v3');
    // const result = await androidpublisher.purchases.subscriptions.get({
    //   packageName: 'kz.receptor.app',
    //   subscriptionId: productId,
    //   token: token,
    // });

    this.logger.warn('Using MOCK Google verification - replace in production!');
    return token && token.length > 10;
  }

  private async mockAppleVerification(receipt: string, productId: string): Promise<boolean> {
    // В проде заменить на App Store Server API
    this.logger.warn('Using MOCK Apple verification - replace in production!');
    return receipt && receipt.length > 10;
  }
}
