import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.recipesService.findAll(user.id, page, limit);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createRecipeDto: CreateRecipeDto) {
    return this.recipesService.create(user.id, createRecipeDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRecipeDto: UpdateRecipeDto) {
    return this.recipesService.update(id, updateRecipeDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.recipesService.delete(id);
  }
}
