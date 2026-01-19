import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  name: string;

  @IsString()
  shortName: string;

  @IsOptional()
  @IsEnum(['WEIGHT', 'VOLUME', 'PIECE', 'CUSTOM'])
  type?: string;

  @IsOptional()
  @IsString()
  baseUnitId?: string;

  @IsOptional()
  @IsNumber()
  conversionFactor?: number;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsEnum(['WEIGHT', 'VOLUME', 'PIECE', 'CUSTOM'])
  type?: string;

  @IsOptional()
  @IsString()
  baseUnitId?: string;

  @IsOptional()
  @IsNumber()
  conversionFactor?: number;
}
