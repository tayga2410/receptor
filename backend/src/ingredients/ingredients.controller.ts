import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';

@Controller('ingredients')
@UseGuards(JwtAuthGuard)
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.ingredientsService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.create(user.id, createIngredientDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIngredientDto: UpdateIngredientDto) {
    return this.ingredientsService.update(id, updateIngredientDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.ingredientsService.delete(id);
  }
}
