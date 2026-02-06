import { IsString, IsNumber, IsOptional, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesItemDto {
  @IsString()
  recipeId: string;

  @IsNumber()
  quantity: number;
}

export class CreateSalesRecordDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesItemDto)
  items: CreateSalesItemDto[];
}

export class UpdateSalesRecordDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesItemDto)
  items?: CreateSalesItemDto[];
}
