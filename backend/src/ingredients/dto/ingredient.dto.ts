import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsString()
  unitId: string;

  @IsNumber()
  pricePerUnit: number;

  @IsEnum(['KZT', 'RUB', 'KGS', 'UZS', 'USD', 'EUR'])
  currency: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsNumber()
  pricePerUnit?: number;

  @IsOptional()
  @IsEnum(['KZT', 'RUB', 'KGS', 'UZS', 'USD', 'EUR'])
  currency?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
