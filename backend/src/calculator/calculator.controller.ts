import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('calculator')
@UseGuards(JwtAuthGuard)
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Post('calculate')
  calculate(@Body() data: { ingredients: any[] }) {
    return {
      costPrice: this.calculatorService.calculateCostPrice(data.ingredients),
    };
  }

  @Post('sale-price')
  calculateSalePrice(@Body() data: { costPrice: number; marginPercent: number }) {
    return {
      salePrice: this.calculatorService.calculateSalePrice(data.costPrice, data.marginPercent),
    };
  }

  @Post('margin')
  calculateMargin(@Body() data: { salePrice: number; costPrice: number }) {
    return {
      marginPercent: this.calculatorService.calculateMarginPercent(data.salePrice, data.costPrice),
    };
  }

  @Post('business-margin')
  calculateBusinessMargin(@Body() data: { recipes: any[] }) {
    return this.calculatorService.calculateBusinessMargin(data.recipes);
  }
}
