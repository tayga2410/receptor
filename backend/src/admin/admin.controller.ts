import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class GrantSubscriptionDto {
  months?: number;
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Дашборд с метриками
  @Get('dashboard')
  async getDashboard(@CurrentUser('userId') adminId: string) {
    return this.adminService.getDashboardMetrics(adminId);
  }

  // Список всех пользователей
  @Get('users')
  async getAllUsers(@CurrentUser('userId') adminId: string) {
    return this.adminService.getAllUsers(adminId);
  }

  // Поиск пользователей
  @Get('users/search')
  async searchUsers(
    @CurrentUser('userId') adminId: string,
    @Query('q') query: string,
  ) {
    return this.adminService.searchUsers(adminId, query);
  }

  // Выдать Ambassador подписку
  @Post('users/:userId/ambassador')
  async grantAmbassador(
    @CurrentUser('userId') adminId: string,
    @Param('userId') userId: string,
    @Body() dto: GrantSubscriptionDto,
  ) {
    return this.adminService.grantAmbassador(adminId, userId, dto.months || 12);
  }

  // Выдать Premium подписку (после оплаты)
  @Post('users/:userId/premium')
  async grantPremium(
    @CurrentUser('userId') adminId: string,
    @Param('userId') userId: string,
    @Body() dto: GrantSubscriptionDto,
  ) {
    return this.adminService.grantPremium(adminId, userId, dto.months || 1);
  }

  // Отозвать подписку
  @Post('users/:userId/revoke')
  async revokeSubscription(
    @CurrentUser('userId') adminId: string,
    @Param('userId') userId: string,
  ) {
    return this.adminService.revokeSubscription(adminId, userId);
  }

  // Удалить пользователя
  @Delete('users/:userId')
  async deleteUser(
    @CurrentUser('userId') adminId: string,
    @Param('userId') userId: string,
  ) {
    return this.adminService.deleteUser(adminId, userId);
  }
}
