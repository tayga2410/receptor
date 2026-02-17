import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSalesRecordDto, UpdateSalesRecordDto } from './dto/sales-record.dto';
import { CalculatorService } from '../calculator/calculator.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private calculator: CalculatorService,
  ) {}

  async findAll(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return this.prisma.salesRecord.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByDate(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await this.prisma.salesRecord.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: true,
      },
      orderBy: { date: 'desc' },
    });

    return this.aggregateDayRecords(records);
  }

  async findOne(id: string, userId: string) {
    const record = await this.prisma.salesRecord.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!record) {
      throw new NotFoundException('Sales record not found');
    }

    return record;
  }

  async create(userId: string, createSalesRecordDto: CreateSalesRecordDto) {
    const recipeIds = createSalesRecordDto.items.map(item => item.recipeId);
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: { ingredients: { include: { ingredient: true, unit: true } } },
    });

    const recipeMap = new Map(recipes.map(r => [r.id, r]));

    for (const item of createSalesRecordDto.items) {
      const recipe = recipeMap.get(item.recipeId);
      if (!recipe) {
        throw new NotFoundException(`Recipe ${item.recipeId} not found`);
      }
      if (recipe.userId !== userId) {
        throw new BadRequestException(`Recipe ${item.recipeId} does not belong to user`);
      }
    }

    const items = createSalesRecordDto.items.map(item => {
      const recipe = recipeMap.get(item.recipeId);
      const costPrice = this.calculator.calculateCostPrice(recipe.ingredients);

      return {
        recipeId: item.recipeId,
        quantity: item.quantity,
        snapshotSalePrice: recipe.salePrice,
        snapshotCostPrice: costPrice,
        currency: recipe.currency,
        recipeName: recipe.name,
      };
    });

    return this.prisma.salesRecord.create({
      data: {
        userId,
        date: createSalesRecordDto.date || new Date(),
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async update(id: string, userId: string, updateSalesRecordDto: UpdateSalesRecordDto) {
    await this.findOne(id, userId);

    const updateData: any = {};
    if (updateSalesRecordDto.date) {
      updateData.date = updateSalesRecordDto.date;
    }

    if (updateSalesRecordDto.items) {
      const recipeIds = updateSalesRecordDto.items.map(item => item.recipeId);
      const recipes = await this.prisma.recipe.findMany({
        where: { id: { in: recipeIds } },
        include: { ingredients: { include: { ingredient: true, unit: true } } },
      });

      const recipeMap = new Map(recipes.map(r => [r.id, r]));

      const items = updateSalesRecordDto.items.map(item => {
        const recipe = recipeMap.get(item.recipeId);
        const costPrice = this.calculator.calculateCostPrice(recipe.ingredients);

        return {
          recipeId: item.recipeId,
          quantity: item.quantity,
          snapshotSalePrice: recipe.salePrice,
          snapshotCostPrice: costPrice,
          currency: recipe.currency,
          recipeName: recipe.name,
        };
      });

      updateData.items = {
        deleteMany: {},
        create: items,
      };
    }

    return this.prisma.salesRecord.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.salesRecord.delete({
      where: { id },
    });
  }

  async removePortion(salesRecordId: string, salesItemId: string, userId: string, quantityToRemove: number = 1) {
    const record = await this.findOne(salesRecordId, userId);
    const item = record.items.find(i => i.id === salesItemId);

    if (!item) {
      throw new NotFoundException('Sales item not found');
    }

    if (quantityToRemove <= 0) {
      throw new BadRequestException('Quantity to remove must be positive');
    }

    if (quantityToRemove >= item.quantity) {
      // Remove the entire item if quantity becomes 0 or less
      await this.prisma.salesItem.delete({
        where: { id: salesItemId },
      });
    } else {
      // Decrease the quantity
      await this.prisma.salesItem.update({
        where: { id: salesItemId },
        data: {
          quantity: item.quantity - quantityToRemove,
        },
      });
    }

    // Return updated record
    return this.findOne(salesRecordId, userId);
  }

  async removeItem(salesRecordId: string, salesItemId: string, userId: string) {
    const record = await this.findOne(salesRecordId, userId);
    const item = record.items.find(i => i.id === salesItemId);

    if (!item) {
      throw new NotFoundException('Sales item not found');
    }

    await this.prisma.salesItem.delete({
      where: { id: salesItemId },
    });

    // Return updated record
    return this.findOne(salesRecordId, userId);
  }

  async addPortion(salesRecordId: string, salesItemId: string, userId: string, quantityToAdd: number = 1) {
    const record = await this.findOne(salesRecordId, userId);
    const item = record.items.find(i => i.id === salesItemId);

    if (!item) {
      throw new NotFoundException('Sales item not found');
    }

    if (quantityToAdd <= 0) {
      throw new BadRequestException('Quantity to add must be positive');
    }

    await this.prisma.salesItem.update({
      where: { id: salesItemId },
      data: {
        quantity: item.quantity + quantityToAdd,
      },
    });

    // Return updated record
    return this.findOne(salesRecordId, userId);
  }

  async getAnalytics(userId: string, startDate?: Date, endDate?: Date) {
    const records = await this.findAll(userId, startDate, endDate);

    const expenses = await this.prisma.expense.findMany({
      where: { userId },
    });
    const totalMonthlyExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    const recipeSales = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const record of records) {
      for (const item of record.items) {
        const revenue = item.snapshotSalePrice * item.quantity;
        const cost = item.snapshotCostPrice * item.quantity;
        const profit = revenue - cost;

        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += profit;

        if (!recipeSales.has(item.recipeId)) {
          recipeSales.set(item.recipeId, {
            name: item.recipeName || 'Unknown',
            quantity: 0,
            revenue: 0,
          });
        }
        const recipe = recipeSales.get(item.recipeId);
        recipe.quantity += item.quantity;
        recipe.revenue += revenue;
      }
    }

    const start = startDate || new Date(Math.min(...records.map(r => r.date.getTime()), Date.now()));
    const end = endDate || new Date(Math.max(...records.map(r => r.date.getTime()), Date.now()));
    const daysInPeriod = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Get days in current month for daily expenses calculation
    const now = new Date();
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyExpenses = totalMonthlyExpenses / daysInCurrentMonth;

    // Debug log
    console.log('=== ANALYTICS DEBUG ===');
    console.log('Monthly expenses:', totalMonthlyExpenses);
    console.log('Days in current month:', daysInCurrentMonth);
    console.log('Daily expenses:', dailyExpenses);
    console.log('Period start:', start.toISOString());
    console.log('Period end:', end.toISOString());
    console.log('Hours difference:', (end.getTime() - start.getTime()) / (1000 * 60 * 60));
    console.log('Days in period:', daysInPeriod);
    console.log('Period expenses total:', dailyExpenses * daysInPeriod);
    console.log('=====================');

    const netProfit = totalProfit - (dailyExpenses * daysInPeriod);

    const topRecipes = Array.from(recipeSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      period: {
        start,
        end,
        days: daysInPeriod,
      },
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalProfit,
      expenses: {
        monthly: totalMonthlyExpenses,
        daily: dailyExpenses,
        periodTotal: dailyExpenses * daysInPeriod,
      },
      netProfit,
      topRecipes,
      recordsCount: records.length,
    };
  }

  async getCalendar(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await this.prisma.salesRecord.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        items: true,
      },
    });

    const dailySales = new Map<number, number>();
    for (const record of records) {
      const day = record.date.getDate();
      const dailyTotal = record.items.reduce(
        (sum, item) => sum + item.snapshotSalePrice * item.quantity,
        0
      );
      dailySales.set(day, (dailySales.get(day) || 0) + dailyTotal);
    }

    const markedDates: Record<string, { totalSales: number; dotColor: string }> = {};
    dailySales.forEach((total, day) => {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      markedDates[dateStr] = {
        totalSales: total,
        dotColor: total > 0 ? '#4CAF50' : '#9E9E9E',
      };
    });

    return markedDates;
  }

  private aggregateDayRecords(records: any[]) {
    if (records.length === 0) {
      return {
        date: new Date(),
        items: [],
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
      };
    }

    // Add salesRecordId to each item for deletion functionality
    const allItems = records.flatMap(r =>
      r.items.map(item => ({
        ...item,
        salesRecordId: r.id,
      }))
    );
    const totalRevenue = allItems.reduce((sum, item) => sum + item.snapshotSalePrice * item.quantity, 0);
    const totalCost = allItems.reduce((sum, item) => sum + item.snapshotCostPrice * item.quantity, 0);
    const totalProfit = totalRevenue - totalCost;

    return {
      date: records[0].date,
      items: allItems,
      totalRevenue,
      totalCost,
      totalProfit,
    };
  }
}
