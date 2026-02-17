import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseItemDto, UpdateExpenseItemDto } from './dto/expense-item.dto';

@Injectable()
export class ExpenseItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.expenseItem.findMany({
      where: { userId },
      include: { unit: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const expenseItem = await this.prisma.expenseItem.findFirst({
      where: { id, userId },
      include: { unit: true },
    });

    if (!expenseItem) {
      throw new NotFoundException('Expense item not found');
    }

    return expenseItem;
  }

  async create(userId: string, createExpenseItemDto: CreateExpenseItemDto) {
    return this.prisma.expenseItem.create({
      data: {
        ...createExpenseItemDto,
        userId,
      },
      include: { unit: true },
    });
  }

  async update(id: string, userId: string, updateExpenseItemDto: UpdateExpenseItemDto) {
    await this.findOne(id, userId);

    return this.prisma.expenseItem.update({
      where: { id },
      data: updateExpenseItemDto,
      include: { unit: true },
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.expenseItem.delete({
      where: { id },
    });
  }
}
