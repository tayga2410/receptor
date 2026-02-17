import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExpenseItemsService } from './expense-items.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateExpenseItemDto, UpdateExpenseItemDto } from './dto/expense-item.dto';

@Controller('expense-items')
@UseGuards(JwtAuthGuard)
export class ExpenseItemsController {
  constructor(private readonly expenseItemsService: ExpenseItemsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.expenseItemsService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createExpenseItemDto: CreateExpenseItemDto) {
    return this.expenseItemsService.create(user.id, createExpenseItemDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() updateExpenseItemDto: UpdateExpenseItemDto) {
    return this.expenseItemsService.update(id, user.id, updateExpenseItemDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expenseItemsService.delete(id, user.id);
  }
}
