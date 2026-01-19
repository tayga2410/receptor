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
    const existingUnits = await this.prisma.unit.findMany({
      where: { isSystem: true },
    });

    if (existingUnits.length > 0) {
      return;
    }

    const systemUnits = [
      // Вес (Weight)
      { name: 'Килограмм', shortName: 'кг', type: UnitType.WEIGHT, baseUnitId: '', conversionFactor: 1 },
      { name: 'Грамм', shortName: 'г', type: UnitType.WEIGHT, baseUnitId: '', conversionFactor: 0.001 },
      { name: 'Миллиграмм', shortName: 'мг', type: UnitType.WEIGHT, baseUnitId: '', conversionFactor: 0.000001 },
      
      // Объем (Volume)
      { name: 'Литр', shortName: 'л', type: UnitType.VOLUME, baseUnitId: '', conversionFactor: 1 },
      { name: 'Миллилитр', shortName: 'мл', type: UnitType.VOLUME, baseUnitId: '', conversionFactor: 0.001 },
      
      // Штучный (Piece)
      { name: 'Штука', shortName: 'шт', type: UnitType.PIECE, baseUnitId: '', conversionFactor: 1 },
    ];

    await this.prisma.unit.createMany({
      data: systemUnits.map((unit) => ({
        ...unit,
        isSystem: true,
      })),
    });

    console.log('System units seeded successfully');
  }
}
