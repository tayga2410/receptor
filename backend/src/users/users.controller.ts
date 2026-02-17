import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Get('me/usage')
  getUsageStats(@CurrentUser() user: any) {
    return this.usersService.getUsageStats(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() updateDto: any) {
    return this.usersService.updateProfile(user.id, updateDto);
  }

  @Patch('me/currency')
  updateCurrency(@CurrentUser() user: any, @Body('currency') currency: string) {
    return this.usersService.updateCurrency(user.id, currency);
  }
}
