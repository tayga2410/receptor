import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnitType, SubscriptionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedSystemUnits();
    await this.seedAdminUser();
  }

  private async seedSystemUnits() {
    const systemUnits = [
      // Вес (Weight)
      { name: 'Килограмм', shortName: 'кг', type: UnitType.WEIGHT, baseUnitId: '', conversionFactor: 1 },
      { name: 'Грамм', shortName: 'г', type: UnitType.WEIGHT, baseUnitId: '', conversionFactor: 0.001 },
      { name: 'Миллиграмм', shortName: 'мг', type: UnitType.WEIGHT, baseUnitId: '', conversionFactor: 0.000001 },

      // Объем (Volume)
      { name: 'Литр', shortName: 'л', type: UnitType.VOLUME, baseUnitId: '', conversionFactor: 1 },
      { name: 'Миллилитр', shortName: 'мл', type: UnitType.VOLUME, baseUnitId: '', conversionFactor: 0.001 },

      // Длина (Length)
      { name: 'Метр', shortName: 'м', type: UnitType.LENGTH, baseUnitId: '', conversionFactor: 1 },
      { name: 'Сантиметр', shortName: 'см', type: UnitType.LENGTH, baseUnitId: '', conversionFactor: 0.01 },

      // Штучный (Piece)
      { name: 'Штука', shortName: 'шт', type: UnitType.PIECE, baseUnitId: '', conversionFactor: 1 },
    ];

    let addedCount = 0;
    for (const unit of systemUnits) {
      const existing = await this.prisma.unit.findFirst({
        where: { shortName: unit.shortName, isSystem: true },
      });

      if (!existing) {
        await this.prisma.unit.create({
          data: { ...unit, isSystem: true },
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      console.log(`Added ${addedCount} new system units`);
    }
  }

  private async seedAdminUser() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Admin';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    // Если не заданы креды админа — пропускаем
    if (!adminEmail || !adminPassword) {
      return;
    }

    // Проверяем существует ли уже такой пользователь
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      // Если пользователь существует, но не админ — обновляем
      if (!existingAdmin.isAdmin) {
        await this.prisma.user.update({
          where: { email: adminEmail },
          data: {
            isAdmin: true,
            subscriptionType: SubscriptionType.PREMIUM,
          },
        });
        console.log(`Updated user ${adminEmail} to admin`);
      }
      return;
    }

    // Создаём нового админа
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await this.prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        name: adminName,
        isAdmin: true,
        subscriptionType: SubscriptionType.PREMIUM,
      },
    });

    console.log(`Created admin user: ${adminEmail}`);
  }
}
