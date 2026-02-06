import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CalculatorModule } from '../calculator/calculator.module';

@Module({
  imports: [PrismaModule, CalculatorModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
