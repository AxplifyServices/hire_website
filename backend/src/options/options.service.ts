import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListOptionsDto } from './dto/list-options.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic() {
    return this.prisma.options.findMany({
      orderBy: {
        nom: 'asc',
      },
    });
  }

  async findAll(dto: ListOptionsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = dto.sort_by ?? 'id_option';
    const sortOrder = dto.sort_order ?? 'desc';
    const search = dto.search?.trim();

    const where: Prisma.optionsWhereInput = {
      ...(search
        ? {
            OR: [
              { id_option: { contains: search, mode: 'insensitive' } },
              { nom: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, options] = await Promise.all([
      this.prisma.options.count({ where }),
      this.prisma.options.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
    ]);

    return {
      data: options,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
      filters: {
        search: dto.search ?? null,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    };
  }

  async findOne(id_option: string) {
    const option = await this.prisma.options.findUnique({
      where: { id_option },
    });

    if (!option) {
      throw new NotFoundException('Option introuvable.');
    }

    return option;
  }

  async create(dto: CreateOptionDto) {
    const normalizedName = dto.nom.trim();

    const existing = await this.prisma.options.findFirst({
      where: {
        nom: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
      select: {
        id_option: true,
      },
    });

    if (existing) {
      throw new ConflictException('Une option existe déjà avec ce nom.');
    }

    const option = await this.prisma.options.create({
      data: {
        id_option: await this.generateOptionId(),
        nom: normalizedName,
        description: dto.description?.trim() || null,
        prix_jour: dto.prix_jour,
      },
    });

    return {
      message: 'Option créée avec succès.',
      option,
    };
  }

  async update(id_option: string, dto: UpdateOptionDto) {
    const existing = await this.prisma.options.findUnique({
      where: { id_option },
      select: {
        id_option: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Option introuvable.');
    }

    if (dto.nom !== undefined) {
      const owner = await this.prisma.options.findFirst({
        where: {
          nom: {
            equals: dto.nom.trim(),
            mode: 'insensitive',
          },
        },
        select: {
          id_option: true,
        },
      });

      if (owner && owner.id_option !== id_option) {
        throw new ConflictException('Une option existe déjà avec ce nom.');
      }
    }

    const option = await this.prisma.options.update({
      where: { id_option },
      data: {
        ...(dto.nom !== undefined ? { nom: dto.nom.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.prix_jour !== undefined ? { prix_jour: dto.prix_jour } : {}),
      },
    });

    return {
      message: 'Option modifiée avec succès.',
      option,
    };
  }

  async remove(id_option: string) {
    const existing = await this.prisma.options.findUnique({
      where: { id_option },
      select: {
        id_option: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Option introuvable.');
    }

    await this.prisma.options.delete({
      where: { id_option },
    });

    return {
      message: 'Option supprimée avec succès.',
      id_option,
    };
  }

  private async generateOptionId(): Promise<string> {
    const lastOption = await this.prisma.options.findFirst({
      where: {
        id_option: {
          startsWith: 'OPT',
        },
      },
      orderBy: {
        id_option: 'desc',
      },
      select: {
        id_option: true,
      },
    });

    if (!lastOption) {
      return 'OPT00000001';
    }

    const lastNumber = Number(lastOption.id_option.replace('OPT', '')) || 0;
    const nextNumber = lastNumber + 1;

    return `OPT${String(nextNumber).padStart(8, '0')}`;
  }
}