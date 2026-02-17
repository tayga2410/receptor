import { Module } from '@nestjs/common';
import { ExpenseItemsService } from './expense-items.service';
import { ExpenseItemsController } from './expense-items.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExpenseItemsController],
  providers: [ExpenseItemsService],
  exports: [ExpenseItemsService],
})
export class ExpenseItemsModule {}
