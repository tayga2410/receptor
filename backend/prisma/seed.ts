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
    { name: 'Килограмм', nameKZ: 'Килограмм', nameEN: 'Kilogram', shortName: 'кг', type: UnitType.WEIGHT },
    { name: 'Грамм', nameKZ: 'Грамм', nameEN: 'Gram', shortName: 'г', type: UnitType.WEIGHT },
    { name: 'Литр', nameKZ: 'Литр', nameEN: 'Liter', shortName: 'л', type: UnitType.VOLUME },
    { name: 'Миллилитр', nameKZ: 'Миллилитр', nameEN: 'Milliliter', shortName: 'мл', type: UnitType.VOLUME },
    { name: 'Штука', nameKZ: 'Дана', nameEN: 'Piece', shortName: 'шт', type: UnitType.PIECE },
  ];

  for (const unit of systemUnits) {
    await prisma.unit.upsert({
      where: { shortName: unit.shortName },
      update: {
        name: unit.name,
        nameKZ: unit.nameKZ,
        nameEN: unit.nameEN,
        type: unit.type,
        isSystem: true,
      },
      create: {
        name: unit.name,
        nameKZ: unit.nameKZ,
        nameEN: unit.nameEN,
        shortName: unit.shortName,
        type: unit.type,
        isSystem: true,
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
