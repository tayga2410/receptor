import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.expensesService.findAll(user.id);
  }

  @Get('total')
  getTotal(@CurrentUser() user: any) {
    return this.expensesService.getTotalExpenses(user.id).then(total => ({ total }));
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(user.id, createExpenseDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, user.id, updateExpenseDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.delete(id, user.id);
  }
}
