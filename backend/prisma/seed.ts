import { PrismaClient, UnitType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const systemUnits = [
    { name: 'Килограмм', shortName: 'kg', type: UnitType.WEIGHT, baseUnitId: 'gram', conversionFactor: 1000, isSystem: true },
    { name: 'Грамм', shortName: 'g', type: UnitType.WEIGHT, baseUnitId: 'gram', conversionFactor: 1, isSystem: true },
    { name: 'Литр', shortName: 'l', type: UnitType.VOLUME, baseUnitId: 'milliliter', conversionFactor: 1000, isSystem: true },
    { name: 'Миллилитр', shortName: 'ml', type: UnitType.VOLUME, baseUnitId: 'milliliter', conversionFactor: 1, isSystem: true },
    { name: 'Штука', shortName: 'шт', type: UnitType.PIECE, baseUnitId: 'piece', conversionFactor: 1, isSystem: true },
    { name: 'Столовая ложка', shortName: 'ст. ложка', type: UnitType.VOLUME, baseUnitId: 'milliliter', conversionFactor: 15, isSystem: true },
    { name: 'Чайная ложка', shortName: 'ч. ложка', type: UnitType.VOLUME, baseUnitId: 'milliliter', conversionFactor: 5, isSystem: true },
    { name: 'Зубчик', shortName: 'зубчик', type: UnitType.PIECE, baseUnitId: 'piece', conversionFactor: 1, isSystem: true },
  ];

  for (const unit of systemUnits) {
    await prisma.unit.upsert({
      where: { shortName: unit.shortName },
      update: {},
      create: {
        name: unit.name,
        shortName: unit.shortName,
        type: unit.type,
        baseUnitId: unit.baseUnitId,
        conversionFactor: unit.conversionFactor,
        isSystem: unit.isSystem,
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
