import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTarificationDto } from './dto/create-tarification.dto';
import { ListTarificationsDto } from './dto/list-tarifications.dto';
import { UpdateTarificationDto } from './dto/update-tarification.dto';

@Injectable()
export class TarificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic() {
    const tarifications = await this.prisma.tarifications.findMany({
      orderBy: {
        nom: 'asc',
      },
      select: {
        id_tarification: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        discount_rate: true,
      },
    });

    return tarifications.map((item) => this.serialize(item));
  }

  async findAll(dto: ListTarificationsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = dto.sort_by ?? 'id_tarification';
    const sortOrder = dto.sort_order ?? 'desc';
    const search = dto.search?.trim();

    const where: Prisma.tarificationsWhereInput = {
      ...(search
        ? {
            OR: [
              { id_tarification: { contains: search, mode: 'insensitive' } },
              { nom: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { qualificatif: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, tarifications] = await Promise.all([
      this.prisma.tarifications.count({ where }),
      this.prisma.tarifications.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id_tarification: true,
          nom: true,
          description: true,
          qualificatif: true,
          avantages: true,
          discount_rate: true,
        },
      }),
    ]);

    return {
      data: tarifications.map((item) => this.serialize(item)),
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

  async findOne(id_tarification: string) {
    const tarification = await this.prisma.tarifications.findUnique({
      where: { id_tarification },
      select: {
        id_tarification: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        discount_rate: true,
      },
    });

    if (!tarification) {
      throw new NotFoundException('Tarification introuvable.');
    }

    return this.serialize(tarification);
  }

  async create(dto: CreateTarificationDto) {
    const normalizedName = dto.nom.trim();

    const existing = await this.prisma.tarifications.findFirst({
      where: {
        nom: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
      select: {
        id_tarification: true,
      },
    });

    if (existing) {
      throw new ConflictException('Une tarification existe déjà avec ce nom.');
    }

    const tarification = await this.prisma.tarifications.create({
      data: {
        id_tarification: await this.generateTarificationId(),
        nom: normalizedName,
        description: dto.description?.trim() || null,
        qualificatif: dto.qualificatif?.trim() || null,
        avantages: this.normalizeAdvantages(dto.avantages),
        discount_rate: dto.discount_rate,
      },
      select: {
        id_tarification: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        discount_rate: true,
      },
    });

    return {
      message: 'Tarification créée avec succès.',
      tarification: this.serialize(tarification),
    };
  }

  async update(id_tarification: string, dto: UpdateTarificationDto) {
    const existing = await this.prisma.tarifications.findUnique({
      where: { id_tarification },
      select: {
        id_tarification: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Tarification introuvable.');
    }

    if (dto.nom !== undefined) {
      const owner = await this.prisma.tarifications.findFirst({
        where: {
          nom: {
            equals: dto.nom.trim(),
            mode: 'insensitive',
          },
        },
        select: {
          id_tarification: true,
        },
      });

      if (owner && owner.id_tarification !== id_tarification) {
        throw new ConflictException('Une tarification existe déjà avec ce nom.');
      }
    }

    const tarification = await this.prisma.tarifications.update({
      where: { id_tarification },
      data: {
        ...(dto.nom !== undefined ? { nom: dto.nom.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.qualificatif !== undefined
          ? { qualificatif: dto.qualificatif?.trim() || null }
          : {}),
        ...(dto.avantages !== undefined
          ? { avantages: this.normalizeAdvantages(dto.avantages) }
          : {}),
        ...(dto.discount_rate !== undefined
          ? { discount_rate: dto.discount_rate }
          : {}),
      },
      select: {
        id_tarification: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        discount_rate: true,
      },
    });

    return {
      message: 'Tarification modifiée avec succès.',
      tarification: this.serialize(tarification),
    };
  }

  async remove(id_tarification: string) {
    const existing = await this.prisma.tarifications.findUnique({
      where: { id_tarification },
      select: {
        id_tarification: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Tarification introuvable.');
    }

    const [reservationsCount, reservationsEntreprisesCount] = await Promise.all([
      this.prisma.reservations.count({ where: { id_tarification } }),
      this.prisma.reservations_entreprises.count({ where: { id_tarification } }),
    ]);

    if (reservationsCount > 0 || reservationsEntreprisesCount > 0) {
      throw new ConflictException(
        'Impossible de supprimer cette tarification car elle est déjà utilisée dans des réservations.',
      );
    }

    await this.prisma.tarifications.delete({
      where: { id_tarification },
    });

    return {
      message: 'Tarification supprimée avec succès.',
      id_tarification,
    };
  }

  private normalizeAdvantages(avantages?: string[]) {
    return (avantages ?? [])
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private serialize(item: {
    id_tarification: string;
    nom: string | null;
    description: string | null;
    qualificatif: string | null;
    avantages: string[];
    discount_rate: Prisma.Decimal | number | null;
  }) {
    return {
      ...item,
      discount_rate:
        item.discount_rate !== null ? Number(item.discount_rate) : null,
    };
  }

  private async generateTarificationId(): Promise<string> {
    const lastTarification = await this.prisma.tarifications.findFirst({
      where: {
        id_tarification: {
          startsWith: 'TAR',
        },
      },
      orderBy: {
        id_tarification: 'desc',
      },
      select: {
        id_tarification: true,
      },
    });

    if (!lastTarification) {
      return 'TAR00000001';
    }

    const lastNumber =
      Number(lastTarification.id_tarification.replace('TAR', '')) || 0;
    const nextNumber = lastNumber + 1;

    return `TAR${String(nextNumber).padStart(8, '0')}`;
  }
}