import { IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAnalyticsDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
