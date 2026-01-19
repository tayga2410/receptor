import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

@Controller('units')
@UseGuards(JwtAuthGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.unitsService.findAll(user.id);
  }

  @Public()
  @Get('system')
  findSystem() {
    return this.unitsService.findSystem();
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(user.id, createUnitDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
    return this.unitsService.update(id, updateUnitDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.unitsService.delete(id);
  }
}
