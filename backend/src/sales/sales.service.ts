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
        expenseItems: { include: { expenseItem: { include: { unit: true } } } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByDate(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('findByDate - startOfDay:', startOfDay.toISOString());
    console.log('findByDate - endOfDay:', endOfDay.toISOString());
    console.log('findByDate - userId:', userId);

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
        expenseItems: { include: { expenseItem: { include: { unit: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('findByDate - records found:', records.length);

    return this.formatDayRecords(records);
  }

  async findOne(id: string, userId: string) {
    const record = await this.prisma.salesRecord.findFirst({
      where: { id, userId },
      include: {
        items: true,
        expenseItems: { include: { expenseItem: { include: { unit: true } } } },
      },
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
      include: { ingredients: { include: { ingredient: { include: { unit: true } }, unit: true } } },
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
      const totalCostPrice = this.calculator.calculateCostPrice(recipe.ingredients);
      const portions = recipe.portions || 1;
      const costPricePerPortion = totalCostPrice / portions;

      return {
        recipeId: item.recipeId,
        quantity: item.quantity,
        snapshotSalePrice: recipe.salePrice,
        snapshotCostPrice: costPricePerPortion,
        currency: recipe.currency,
        recipeName: recipe.name,
      };
    });

    // Process expense items if provided
    let expenseItemsData: any[] = [];
    if (createSalesRecordDto.expenseItems && createSalesRecordDto.expenseItems.length > 0) {
      const expenseItemIds = createSalesRecordDto.expenseItems.map(e => e.expenseItemId);
      const expenseItems = await this.prisma.expenseItem.findMany({
        where: { id: { in: expenseItemIds } },
        include: { unit: true },
      });

      const expenseItemMap = new Map(expenseItems.map(e => [e.id, e]));

      // Load units for conversion
      const allUnits = await this.prisma.unit.findMany();
      const unitMap = new Map(allUnits.map(u => [u.id, u]));

      for (const item of createSalesRecordDto.expenseItems) {
        const expenseItem = expenseItemMap.get(item.expenseItemId);
        if (!expenseItem) {
          throw new NotFoundException(`Expense item ${item.expenseItemId} not found`);
        }
        if (expenseItem.userId !== userId) {
          throw new BadRequestException(`Expense item ${item.expenseItemId} does not belong to user`);
        }
      }

      expenseItemsData = createSalesRecordDto.expenseItems.map(item => {
        const expenseItem = expenseItemMap.get(item.expenseItemId);

        // Конвертация единиц если указана другая единица
        let finalQuantity = item.quantity;
        if (item.unitId && item.unitId !== expenseItem.unitId) {
          const fromUnit = unitMap.get(item.unitId);
          const toUnit = expenseItem.unit;
          if (fromUnit && toUnit) {
            const fromFactor = fromUnit.conversionFactor || 1;
            const toFactor = toUnit.conversionFactor || 1;
            const inBase = item.quantity * fromFactor;
            finalQuantity = inBase / toFactor;
          }
        }

        return {
          expenseItemId: item.expenseItemId,
          quantity: finalQuantity,
          snapshotPrice: expenseItem.pricePerUnit,
          currency: expenseItem.currency,
        };
      });
    }

    return this.prisma.salesRecord.create({
      data: {
        userId,
        date: createSalesRecordDto.date || new Date(),
        deliveryFee: createSalesRecordDto.deliveryFee || 0,
        items: { create: items },
        expenseItems: expenseItemsData.length > 0 ? { create: expenseItemsData } : undefined,
      },
      include: {
        items: true,
        expenseItems: { include: { expenseItem: { include: { unit: true } } } },
      },
    });
  }

  async update(id: string, userId: string, updateSalesRecordDto: UpdateSalesRecordDto) {
    await this.findOne(id, userId);

    const updateData: any = {};
    if (updateSalesRecordDto.date) {
      updateData.date = updateSalesRecordDto.date;
    }

    if (updateSalesRecordDto.deliveryFee !== undefined) {
      updateData.deliveryFee = updateSalesRecordDto.deliveryFee;
    }

    if (updateSalesRecordDto.items) {
      const recipeIds = updateSalesRecordDto.items.map(item => item.recipeId);
      const recipes = await this.prisma.recipe.findMany({
        where: { id: { in: recipeIds } },
        include: { ingredients: { include: { ingredient: { include: { unit: true } }, unit: true } } },
      });

      const recipeMap = new Map(recipes.map(r => [r.id, r]));

      const items = updateSalesRecordDto.items.map(item => {
        const recipe = recipeMap.get(item.recipeId);
        const totalCostPrice = this.calculator.calculateCostPrice(recipe.ingredients);
        const portions = recipe.portions || 1;
        const costPricePerPortion = totalCostPrice / portions;

        return {
          recipeId: item.recipeId,
          quantity: item.quantity,
          snapshotSalePrice: recipe.salePrice,
          snapshotCostPrice: costPricePerPortion,
          currency: recipe.currency,
          recipeName: recipe.name,
        };
      });

      updateData.items = {
        deleteMany: {},
        create: items,
      };
    }

    // Handle expense items update
    if (updateSalesRecordDto.expenseItems) {
      const expenseItemIds = updateSalesRecordDto.expenseItems.map(e => e.expenseItemId);
      const expenseItems = await this.prisma.expenseItem.findMany({
        where: { id: { in: expenseItemIds } },
        include: { unit: true },
      });

      const expenseItemMap = new Map(expenseItems.map(e => [e.id, e]));
      const allUnits = await this.prisma.unit.findMany();
      const unitMap = new Map(allUnits.map(u => [u.id, u]));

      const expenseItemsData = updateSalesRecordDto.expenseItems.map(item => {
        const expenseItem = expenseItemMap.get(item.expenseItemId);

        let finalQuantity = item.quantity;
        if (item.unitId && item.unitId !== expenseItem.unitId) {
          const fromUnit = unitMap.get(item.unitId);
          const toUnit = expenseItem.unit;
          if (fromUnit && toUnit) {
            const fromFactor = fromUnit.conversionFactor || 1;
            const toFactor = toUnit.conversionFactor || 1;
            const inBase = item.quantity * fromFactor;
            finalQuantity = inBase / toFactor;
          }
        }

        return {
          expenseItemId: item.expenseItemId,
          quantity: finalQuantity,
          snapshotPrice: expenseItem.pricePerUnit,
          currency: expenseItem.currency,
        };
      });

      updateData.expenseItems = {
        deleteMany: {},
        create: expenseItemsData,
      };
    }

    return this.prisma.salesRecord.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        expenseItems: { include: { expenseItem: { include: { unit: true } } } },
      },
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
    let totalSaleExpenseItems = 0;
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

      // Calculate expense items for this record
      if (record.expenseItems) {
        for (const expenseItem of record.expenseItems) {
          totalSaleExpenseItems += expenseItem.snapshotPrice * expenseItem.quantity;
        }
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
    console.log('Sale expense items:', totalSaleExpenseItems);
    console.log('=====================');

    const netProfit = totalProfit - (dailyExpenses * daysInPeriod) - totalSaleExpenseItems;

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
        saleItems: totalSaleExpenseItems,
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
        expenseItems: true,
        deliveryFee: true,
      },
    });

    const dailySales = new Map<number, { revenue: number; profit: number }>();
    for (const record of records) {
      const day = record.date.getDate();

      // Выручка
      const revenue = record.items.reduce(
        (sum, item) => sum + item.snapshotSalePrice * item.quantity,
        0
      );

      // Себестоимость
      const cost = record.items.reduce(
        (sum, item) => sum + item.snapshotCostPrice * item.quantity,
        0
      );

      // Расходы на продукты для этой продажи
      const expenseItemsTotal = (record.expenseItems || []).reduce(
        (sum, ei) => sum + ei.snapshotPrice * ei.quantity,
        0
      );

      // Плата за доставку
      const deliveryFee = record.deliveryFee || 0;

      // Чистая прибыль = выручка - себестоимость - расходы на продукты - доставка
      const profit = revenue - cost - expenseItemsTotal - deliveryFee;

      const existing = dailySales.get(day) || { revenue: 0, profit: 0 };
      dailySales.set(day, {
        revenue: existing.revenue + revenue,
        profit: existing.profit + profit,
      });
    }

    const markedDates: Record<string, { totalSales: number; totalProfit: number; dotColor: string }> = {};
    dailySales.forEach((data, day) => {
      // Only mark dates with actual sales
      if (data.revenue > 0) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        markedDates[dateStr] = {
          totalSales: data.revenue,
          totalProfit: data.profit,
          dotColor: data.profit >= 0 ? '#4CAF50' : '#F44336', // зелёный для прибыли, красный для убытка
        };
      }
    });

    return markedDates;
  }

  private formatDayRecords(records: any[]) {
    if (records.length === 0) {
      return {
        date: new Date(),
        orders: [],
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        totalExpenseItems: 0,
        totalDeliveryFee: 0,
      };
    }

    // Format each record as an order with its own profit calculation
    const orders = records.map(record => {
      const revenue = record.items.reduce((sum, item) => sum + item.snapshotSalePrice * item.quantity, 0);
      const cost = record.items.reduce((sum, item) => sum + item.snapshotCostPrice * item.quantity, 0);
      const expenseItemsTotal = (record.expenseItems || []).reduce((sum, ei) => sum + ei.snapshotPrice * ei.quantity, 0);
      const deliveryFee = record.deliveryFee || 0;
      const profit = revenue - cost - expenseItemsTotal - deliveryFee;

      return {
        id: record.id,
        createdAt: record.createdAt,
        items: record.items,
        expenseItems: record.expenseItems || [],
        deliveryFee,
        revenue,
        cost,
        expenseItemsTotal,
        profit,
      };
    });

    // Calculate day totals
    const totalRevenue = orders.reduce((sum, o) => sum + o.revenue, 0);
    const totalCost = orders.reduce((sum, o) => sum + o.cost, 0);
    const totalProfit = orders.reduce((sum, o) => sum + (o.revenue - o.cost), 0);
    const totalExpenseItems = orders.reduce((sum, o) => sum + o.expenseItemsTotal, 0);
    const totalDeliveryFee = orders.reduce((sum, o) => sum + o.deliveryFee, 0);

    return {
      date: records[0].date,
      orders,
      totalRevenue,
      totalCost,
      totalProfit,
      totalExpenseItems,
      totalDeliveryFee,
    };
  }
}
