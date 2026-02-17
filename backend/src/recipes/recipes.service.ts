import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto';
import { CalculatorService } from '../calculator/calculator.service';
import { Currency, SubscriptionType } from '@prisma/client';

const FREE_TIER_RECIPE_LIMIT = 5;

@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private calculator: CalculatorService,
  ) {}

  // Проверка лимита рецептов для FREE подписки
  private async checkRecipeLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionType: true, subscriptionExpiresAt: true },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    // Если PREMIUM или AMBASSADOR с активной подпиской — безлимит
    if (
      user.subscriptionType === SubscriptionType.PREMIUM ||
      user.subscriptionType === SubscriptionType.AMBASSADOR
    ) {
      // Проверяем не истекла ли подписка
      if (user.subscriptionExpiresAt && new Date() > user.subscriptionExpiresAt) {
        // Подписка истекла — возвращаем на FREE
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionType: SubscriptionType.FREE,
            subscriptionExpiresAt: null,
          },
        });
        // Теперь проверяем лимит
      } else {
        return; // Подписка активна — ограничений нет
      }
    }

    // Для FREE — проверяем лимит
    const currentCount = await this.prisma.recipe.count({
      where: { userId },
    });

    if (currentCount >= FREE_TIER_RECIPE_LIMIT) {
      throw new ForbiddenException(
        `Достигнут лимит рецептов (${FREE_TIER_RECIPE_LIMIT}). Оформите Premium для безлимитного доступа.`
      );
    }
  }

  async findAll(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { userId },
        include: {
          ingredients: {
            include: {
              ingredient: {
                include: {
                  unit: true,
                },
              },
              unit: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recipe.count({ where: { userId } }),
    ]);

    return {
      recipes: recipes.map(recipe => this.calculateRecipeCost(recipe)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: {
              include: {
                unit: true,
              },
            },
            unit: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new BadRequestException('Recipe not found');
    }

    return this.calculateRecipeCost(recipe);
  }

  async create(userId: string, createRecipeDto: CreateRecipeDto) {
    // Проверка лимита рецептов
    await this.checkRecipeLimit(userId);

    const recipe = await this.prisma.recipe.create({
      data: {
        ...createRecipeDto,
        userId,
        currency: createRecipeDto.currency as Currency,
        ingredients: {
          create: createRecipeDto.ingredients,
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: {
              include: {
                unit: true,
              },
            },
            unit: true,
          },
        },
      },
    });

    return this.calculateRecipeCost(recipe);
  }

  async update(id: string, updateRecipeDto: UpdateRecipeDto) {
    const updateData: any = { ...updateRecipeDto };
    if (updateData.currency) {
      updateData.currency = updateData.currency as Currency;
    }

    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        ...updateData,
        ingredients: updateRecipeDto.ingredients ? {
          deleteMany: {},
          create: updateRecipeDto.ingredients,
        } : undefined,
      },
      include: {
        ingredients: {
          include: {
            ingredient: {
              include: {
                unit: true,
              },
            },
            unit: true,
          },
        },
      },
    });

    return this.calculateRecipeCost(recipe);
  }

  async delete(id: string) {
    // Сначала удаляем связанные ингредиенты рецепта
    await this.prisma.recipeIngredient.deleteMany({
      where: { recipeId: id },
    });

    // Затем удаляем сам рецепт
    return this.prisma.recipe.delete({
      where: { id },
    });
  }

  private calculateRecipeCost(recipe: any) {
    const costPrice = this.calculator.calculateCostPrice(recipe.ingredients);
    const marginPercent = recipe.marginPercent || 0;
    // salePrice вычисляется динамически на основе текущей себестоимости и маржи
    const salePrice = costPrice * (1 + marginPercent / 100);
    const profit = salePrice - costPrice;
    const costPerPortion = costPrice / recipe.portions;
    const salePricePerPortion = salePrice / recipe.portions;

    return {
      ...recipe,
      costPrice,
      marginPercent, // возвращаем оригинальную маржу
      salePrice, // возвращаем вычисленную цену продажи
      profit,
      costPerPortion,
      salePricePerPortion,
    };
  }
}
