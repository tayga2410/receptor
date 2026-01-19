import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { UnitType } from '@prisma/client';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.unit.findMany({
      where: {
        OR: [
          { userId },
          { isSystem: true },
        ],
      },
      orderBy: { isSystem: 'desc' },
    });
  }

  async findSystem() {
    return this.prisma.unit.findMany({
      where: { isSystem: true },
    });
  }

  async create(userId: string, createUnitDto: CreateUnitDto) {
    const unit = await this.prisma.unit.create({
      data: {
        ...createUnitDto,
        userId,
        type: createUnitDto.type as UnitType || 'CUSTOM',
        isSystem: false,
      },
    });

    return unit;
  }

  async update(id: string, updateUnitDto: UpdateUnitDto) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
    });

    if (!unit) {
      throw new BadRequestException('Unit not found');
    }

    if (unit.isSystem) {
      throw new ForbiddenException('Cannot update system units');
    }

    const updateData: any = { ...updateUnitDto };
    if (updateData.type) {
      updateData.type = updateData.type as UnitType;
    }

    return this.prisma.unit.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
    });

    if (!unit) {
      throw new BadRequestException('Unit not found');
    }

    if (unit.isSystem) {
      throw new ForbiddenException('Cannot delete system units');
    }

    return this.prisma.unit.delete({
      where: { id },
    });
  }
}
