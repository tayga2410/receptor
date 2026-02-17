import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Currency, SubscriptionType } from '@prisma/client';

const FREE_TIER_RECIPE_LIMIT = 5;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        subscriptionType: true,
        subscriptionExpiresAt: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверяем истечение подписки
    const subscriptionStatus = this.getSubscriptionStatus(user);

    return {
      ...user,
      subscriptionStatus,
      recipeLimit: subscriptionStatus === 'active' ? null : FREE_TIER_RECIPE_LIMIT,
    };
  }

  // Получить статус подписки
  private getSubscriptionStatus(user: { subscriptionType: SubscriptionType; subscriptionExpiresAt: Date | null }): 'active' | 'expired' | 'free' {
    if (user.subscriptionType === SubscriptionType.FREE) {
      return 'free';
    }

    // Для PREMIUM или AMBASSADOR без даты истечения — считаем активной
    if (!user.subscriptionExpiresAt) {
      return 'active';
    }

    return new Date() <= user.subscriptionExpiresAt ? 'active' : 'expired';
  }

  // Получить статистику использования для пользователя
  async getUsageStats(userId: string) {
    const [user, recipesCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionType: true,
          subscriptionExpiresAt: true,
        },
      }),
      this.prisma.recipe.count({ where: { userId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isActive = user.subscriptionType !== SubscriptionType.FREE &&
      (!user.subscriptionExpiresAt || new Date() <= user.subscriptionExpiresAt);

    return {
      recipesCount,
      recipesLimit: isActive ? null : FREE_TIER_RECIPE_LIMIT,
      canCreateRecipes: isActive || recipesCount < FREE_TIER_RECIPE_LIMIT,
      subscriptionType: user.subscriptionType,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      subscriptionStatus: this.getSubscriptionStatus(user),
    };
  }

  async updateProfile(userId: string, updateDto: any) {
    const { name, email, password, currentPassword } = updateDto;
    const updateData: any = {};

    if (password || email) {
      const bcrypt = require('bcrypt');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!currentPassword) {
        throw new BadRequestException('Для смены email или пароля введите текущий пароль');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Неверный текущий пароль');
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
    }

    if (name) {
      updateData.name = name;
    }

    if (email) {
      updateData.email = email;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        subscriptionType: true,
        createdAt: true,
      },
    });
  }

  async updateCurrency(userId: string, currency: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { currency: currency as Currency },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        subscriptionType: true,
        createdAt: true,
      },
    });
  }
}
