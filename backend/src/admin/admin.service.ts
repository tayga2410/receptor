import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubscriptionType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Проверка что пользователь - админ
  private async checkAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) {
      throw new ForbiddenException('Доступ запрещён. Требуются права администратора.');
    }
  }

  // Получить всех пользователей с метриками
  async getAllUsers(adminId: string) {
    await this.checkAdmin(adminId);

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        subscriptionType: true,
        subscriptionExpiresAt: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            recipes: true,
            ingredients: true,
            salesRecords: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      ...user,
      recipesCount: user._count.recipes,
      ingredientsCount: user._count.ingredients,
      salesRecordsCount: user._count.salesRecords,
      _count: undefined,
    }));
  }

  // Получить метрики дашборда
  async getDashboardMetrics(adminId: string) {
    await this.checkAdmin(adminId);

    const [
      totalUsers,
      freeUsers,
      premiumUsers,
      ambassadorUsers,
      totalRecipes,
      totalIngredients,
      totalSalesRecords,
      newUsersThisMonth,
      activeUsersThisMonth,
    ] = await Promise.all([
      // Всего пользователей
      this.prisma.user.count(),
      // Бесплатные
      this.prisma.user.count({
        where: { subscriptionType: SubscriptionType.FREE },
      }),
      // Премиум
      this.prisma.user.count({
        where: { subscriptionType: SubscriptionType.PREMIUM },
      }),
      // Ambassador
      this.prisma.user.count({
        where: { subscriptionType: SubscriptionType.AMBASSADOR },
      }),
      // Всего рецептов
      this.prisma.recipe.count(),
      // Всего ингредиентов
      this.prisma.ingredient.count(),
      // Всего записей продаж
      this.prisma.salesRecord.count(),
      // Новые пользователи за этот месяц
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // Активные пользователи за этот месяц (создали рецепт или продажу)
      this.prisma.user.count({
        where: {
          OR: [
            {
              recipes: {
                some: {
                  createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                  },
                },
              },
            },
            {
              salesRecords: {
                some: {
                  createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                  },
                },
              },
            },
          ],
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        free: freeUsers,
        premium: premiumUsers,
        ambassador: ambassadorUsers,
        newThisMonth: newUsersThisMonth,
        activeThisMonth: activeUsersThisMonth,
      },
      content: {
        totalRecipes,
        totalIngredients,
        totalSalesRecords,
      },
    };
  }

  // Выдать Ambassador подписку
  async grantAmbassador(adminId: string, userId: string, months: number = 12) {
    await this.checkAdmin(adminId);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: SubscriptionType.AMBASSADOR,
        subscriptionExpiresAt: expiresAt,
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionType: true,
        subscriptionExpiresAt: true,
      },
    });

    return user;
  }

  // Выдать Premium подписку (после оплаты)
  async grantPremium(adminId: string, userId: string, months: number = 1) {
    await this.checkAdmin(adminId);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: SubscriptionType.PREMIUM,
        subscriptionExpiresAt: expiresAt,
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionType: true,
        subscriptionExpiresAt: true,
      },
    });

    return user;
  }

  // Отозвать подписку (вернуть на FREE)
  async revokeSubscription(adminId: string, userId: string) {
    await this.checkAdmin(adminId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: SubscriptionType.FREE,
        subscriptionExpiresAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionType: true,
        subscriptionExpiresAt: true,
      },
    });

    return user;
  }

  // Удалить пользователя
  async deleteUser(adminId: string, userId: string) {
    await this.checkAdmin(adminId);

    // Проверяем что не удаляем самого себя
    if (adminId === userId) {
      throw new ForbiddenException('Нельзя удалить собственный аккаунт');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Пользователь удалён' };
  }

  // Поиск пользователей
  async searchUsers(adminId: string, query: string) {
    await this.checkAdmin(adminId);

    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        subscriptionType: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        _count: {
          select: {
            recipes: true,
            ingredients: true,
          },
        },
      },
      take: 20,
    });
  }
}
