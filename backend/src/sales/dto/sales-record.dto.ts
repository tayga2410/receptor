import { IsString, IsNumber, IsOptional, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesItemDto {
  @IsString()
  recipeId: string;

  @IsNumber()
  quantity: number;
}

export class CreateSaleExpenseItemDto {
  @IsString()
  expenseItemId: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  unitId?: string; // Единица измерения, в которой указано количество
}

export class CreateSalesRecordDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesItemDto)
  items: CreateSalesItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleExpenseItemDto)
  expenseItems?: CreateSaleExpenseItemDto[];
}

export class UpdateSalesRecordDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesItemDto)
  items?: CreateSalesItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleExpenseItemDto)
  expenseItems?: CreateSaleExpenseItemDto[];
}
