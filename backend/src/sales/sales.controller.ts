import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateSalesRecordDto, UpdateSalesRecordDto } from './dto/sales-record.dto';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.salesService.findAll(user.id, start, end);
  }

  @Get('calendar')
  getCalendar(
    @CurrentUser() user: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    return this.salesService.getCalendar(
      user.id,
      parseInt(year) || currentYear,
      parseInt(month) || currentMonth,
    );
  }

  @Get('analytics')
  getAnalytics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.salesService.getAnalytics(user.id, start, end);
  }

  @Get('date/:date')
  findByDate(@CurrentUser() user: any, @Param('date') dateStr: string) {
    const date = new Date(dateStr);
    return this.salesService.findByDate(user.id, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesService.findOne(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createSalesRecordDto: CreateSalesRecordDto) {
    return this.salesService.create(user.id, createSalesRecordDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateSalesRecordDto: UpdateSalesRecordDto,
  ) {
    return this.salesService.update(id, user.id, updateSalesRecordDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesService.delete(id, user.id);
  }
}
