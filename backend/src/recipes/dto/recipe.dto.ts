import { IsString, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';

export class CreateRecipeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  portions: number;

  @IsNumber()
  salePrice: number;

  @IsEnum(['KZT', 'RUB', 'KGS', 'UZS', 'USD', 'EUR'])
  currency: string;

  @IsOptional()
  @IsNumber()
  marginPercent?: number;

  @IsArray()
  ingredients: {
    ingredientId: string;
    quantity: number;
    unitId: string;
  }[];
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  portions?: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @IsEnum(['KZT', 'RUB', 'KGS', 'UZS', 'USD', 'EUR'])
  currency?: string;

  @IsOptional()
  @IsNumber()
  marginPercent?: number;

  @IsOptional()
  @IsArray()
  ingredients?: {
    ingredientId: string;
    quantity: number;
    unitId: string;
  }[];
}
