import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  name: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  icon?: string;
}
