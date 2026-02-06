import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto';
import { CalculatorService } from '../calculator/calculator.service';
import { Currency } from '@prisma/client';

@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private calculator: CalculatorService,
  ) {}

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
    const calculatedSalePrice = costPrice * (1 + marginPercent / 100);
    const actualSalePrice = recipe.salePrice;
    const actualMarginPercent = costPrice > 0 ? ((actualSalePrice - costPrice) / costPrice) * 100 : 0;
    const profit = actualSalePrice - costPrice;
    const costPerPortion = costPrice / recipe.portions;
    const salePricePerPortion = actualSalePrice / recipe.portions;

    return {
      ...recipe,
      costPrice,
      marginPercent: actualMarginPercent,
      profit,
      costPerPortion,
      salePricePerPortion,
    };
  }
}
