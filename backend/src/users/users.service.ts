import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { name, password } = updateDto;
    const updateData: any = {};

    if (name) {
      updateData.name = name;
    }

    if (password) {
      const bcrypt = require('bcrypt');
      updateData.password = await bcrypt.hash(password, 10);
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
