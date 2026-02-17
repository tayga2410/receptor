import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Currency } from '@prisma/client';

export class CreateExpenseItemDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  pricePerUnit: number;

  @IsString()
  unitId: string;

  @IsEnum(Currency)
  currency: Currency;

  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateExpenseItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  pricePerUnit?: number;

  @IsString()
  @IsOptional()
  unitId?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
