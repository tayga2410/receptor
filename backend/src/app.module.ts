import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { SeedModule } from './common/seed.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UnitsModule } from './units/units.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecipesModule } from './recipes/recipes.module';
import { CalculatorModule } from './calculator/calculator.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpenseItemsModule } from './expense-items/expense-items.module';
import { SalesModule } from './sales/sales.module';
import { AdminModule } from './admin/admin.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 секунда
        limit: 3,     // 3 запроса
      },
      {
        name: 'medium',
        ttl: 10000,   // 10 секунд
        limit: 20,    // 20 запросов
      },
      {
        name: 'long',
        ttl: 60000,   // 1 минута
        limit: 100,   // 100 запросов
      },
    ]),
    PrismaModule,
    SeedModule,
    AuthModule,
    UsersModule,
    UnitsModule,
    IngredientsModule,
    RecipesModule,
    CalculatorModule,
    ExpensesModule,
    ExpenseItemsModule,
    SalesModule,
    AdminModule,
    BillingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
