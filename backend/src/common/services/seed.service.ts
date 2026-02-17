import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnitType } from '@prisma/client';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedSystemUnits();
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
}
