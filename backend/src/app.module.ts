import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
})
export class AppModule {}
