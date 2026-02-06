import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.expense.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async create(userId: string, createExpenseDto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...createExpenseDto,
        userId,
      },
    });
  }

  async update(id: string, userId: string, updateExpenseDto: UpdateExpenseDto) {
    // Check if expense exists and belongs to user
    await this.findOne(id, userId);

    return this.prisma.expense.update({
      where: { id },
      data: updateExpenseDto,
    });
  }

  async delete(id: string, userId: string) {
    // Check if expense exists and belongs to user
    await this.findOne(id, userId);

    return this.prisma.expense.delete({
      where: { id },
    });
  }

  async getTotalExpenses(userId: string): Promise<number> {
    const expenses = await this.findAll(userId);
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }
}
