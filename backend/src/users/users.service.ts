import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Currency } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        subscriptionType: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateDto: any) {
    const { name, email, password, currentPassword } = updateDto;
    const updateData: any = {};

    if (password || email) {
      const bcrypt = require('bcrypt');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!currentPassword) {
        throw new BadRequestException('Для смены email или пароля введите текущий пароль');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Неверный текущий пароль');
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
    }

    if (name) {
      updateData.name = name;
    }

    if (email) {
      updateData.email = email;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        subscriptionType: true,
        createdAt: true,
      },
    });
  }

  async updateCurrency(userId: string, currency: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { currency: currency as Currency },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        subscriptionType: true,
        createdAt: true,
      },
    });
  }
}
