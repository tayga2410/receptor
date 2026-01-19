import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';
import { Currency, UnitType } from '@prisma/client';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.ingredient.findMany({
      where: { userId },
      include: {
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        unit: true,
      },
    });

    if (!ingredient) {
      throw new BadRequestException('Ingredient not found');
    }

    return ingredient;
  }

  async create(userId: string, createIngredientDto: CreateIngredientDto) {
    return this.prisma.ingredient.create({
      data: {
        ...createIngredientDto,
        userId,
        currency: createIngredientDto.currency as Currency,
      },
      include: {
        unit: true,
      },
    });
  }

  async update(id: string, updateIngredientDto: UpdateIngredientDto) {
    const updateData: any = { ...updateIngredientDto };
    if (updateData.currency) {
      updateData.currency = updateData.currency as Currency;
    }

    const ingredient = await this.prisma.ingredient.update({
      where: { id },
      data: updateData,
      include: {
        unit: true,
      },
    });

    return ingredient;
  }

  async delete(id: string) {
    return this.prisma.ingredient.delete({
      where: { id },
    });
  }
}
