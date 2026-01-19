import { Injectable } from '@nestjs/common';
import { Unit, UnitType } from '@prisma/client';

@Injectable()
export class CalculatorService {
  calculateCostPrice(ingredients: any[]): number {
    return ingredients.reduce((total, recipeIngredient) => {
      const ingredient = recipeIngredient.ingredient;
      const quantityInBase = this.convertToBaseUnit(
        recipeIngredient.quantity,
        recipeIngredient.unit,
        ingredient.unit,
      );
      const cost = (ingredient.pricePerUnit / this.getConversionFactor(ingredient.unit)) * quantityInBase;
      return total + cost;
    }, 0);
  }

  private convertToBaseUnit(quantity: number, fromUnit: Unit, toUnit: Unit): number {
    const quantityInBase = quantity * (fromUnit.conversionFactor || 1);
    const quantityInTarget = quantityInBase / (toUnit.conversionFactor || 1);
    return quantityInTarget;
  }

  private getConversionFactor(unit: Unit): number {
    return unit.conversionFactor || 1;
  }

  calculateSalePrice(costPrice: number, marginPercent: number): number {
    return costPrice * (1 + marginPercent / 100);
  }

  calculateMarginPercent(salePrice: number, costPrice: number): number {
    if (costPrice === 0) return 0;
    return ((salePrice - costPrice) / costPrice) * 100;
  }

  calculateBusinessMargin(recipes: any[]): { totalMargin: number; totalCost: number; businessMargin: number } {
    const totalMargin = recipes.reduce((sum, recipe) => sum + (recipe.profit || 0), 0);
    const totalCost = recipes.reduce((sum, recipe) => sum + (recipe.costPrice || 0), 0);
    const businessMargin = totalCost > 0 ? (totalMargin / totalCost) * 100 : 0;

    return { totalMargin, totalCost, businessMargin };
  }
}
