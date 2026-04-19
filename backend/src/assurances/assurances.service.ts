import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListAssurancesDto } from './dto/list-assurances.dto';
import { CreateAssuranceDto } from './dto/create-assurance.dto';
import { UpdateAssuranceDto } from './dto/update-assurance.dto';

@Injectable()
export class AssurancesService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic() {
    const assurances = await this.prisma.assurances.findMany({
      orderBy: {
        nom: 'asc',
      },
      select: {
        id_assurance: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        prix_jour: true,
      },
    });

    return assurances.map((item) => this.serialize(item));
  }

  async findAll(dto: ListAssurancesDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = dto.sort_by ?? 'id_assurance';
    const sortOrder = dto.sort_order ?? 'desc';
    const search = dto.search?.trim();

    const where: Prisma.assurancesWhereInput = {
      ...(search
        ? {
            OR: [
              { id_assurance: { contains: search, mode: 'insensitive' } },
              { nom: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { qualificatif: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, assurances] = await Promise.all([
      this.prisma.assurances.count({ where }),
      this.prisma.assurances.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id_assurance: true,
          nom: true,
          description: true,
          qualificatif: true,
          avantages: true,
          prix_jour: true,
        },
      }),
    ]);

    return {
      data: assurances.map((item) => this.serialize(item)),
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

  async findOne(id_assurance: string) {
    const assurance = await this.prisma.assurances.findUnique({
      where: { id_assurance },
      select: {
        id_assurance: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        prix_jour: true,
      },
    });

    if (!assurance) {
      throw new NotFoundException('Assurance introuvable.');
    }

    return this.serialize(assurance);
  }

  async create(dto: CreateAssuranceDto) {
    const normalizedName = dto.nom.trim();

    const existing = await this.prisma.assurances.findFirst({
      where: {
        nom: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
      select: {
        id_assurance: true,
      },
    });

    if (existing) {
      throw new ConflictException('Une assurance existe déjà avec ce nom.');
    }

    const assurance = await this.prisma.assurances.create({
      data: {
        id_assurance: await this.generateAssuranceId(),
        nom: normalizedName,
        description: dto.description?.trim() || null,
        qualificatif: dto.qualificatif?.trim() || null,
        avantages: this.normalizeAdvantages(dto.avantages),
        prix_jour: dto.prix_jour,
      },
      select: {
        id_assurance: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        prix_jour: true,
      },
    });

    return {
      message: 'Assurance créée avec succès.',
      assurance: this.serialize(assurance),
    };
  }

  async update(id_assurance: string, dto: UpdateAssuranceDto) {
    const existing = await this.prisma.assurances.findUnique({
      where: { id_assurance },
      select: {
        id_assurance: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Assurance introuvable.');
    }

    if (dto.nom !== undefined) {
      const owner = await this.prisma.assurances.findFirst({
        where: {
          nom: {
            equals: dto.nom.trim(),
            mode: 'insensitive',
          },
        },
        select: {
          id_assurance: true,
        },
      });

      if (owner && owner.id_assurance !== id_assurance) {
        throw new ConflictException('Une assurance existe déjà avec ce nom.');
      }
    }

    const assurance = await this.prisma.assurances.update({
      where: { id_assurance },
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
        ...(dto.prix_jour !== undefined ? { prix_jour: dto.prix_jour } : {}),
      },
      select: {
        id_assurance: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        prix_jour: true,
      },
    });

    return {
      message: 'Assurance modifiée avec succès.',
      assurance: this.serialize(assurance),
    };
  }

  async remove(id_assurance: string) {
    const existing = await this.prisma.assurances.findUnique({
      where: { id_assurance },
      select: {
        id_assurance: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Assurance introuvable.');
    }

    const [reservationsCount, reservationsEntreprisesCount] = await Promise.all([
      this.prisma.reservations.count({ where: { id_assurance } }),
      this.prisma.reservations_entreprises.count({ where: { id_assurance } }),
    ]);

    if (reservationsCount > 0 || reservationsEntreprisesCount > 0) {
      throw new ConflictException(
        'Impossible de supprimer cette assurance car elle est déjà utilisée dans des réservations.',
      );
    }

    await this.prisma.assurances.delete({
      where: { id_assurance },
    });

    return {
      message: 'Assurance supprimée avec succès.',
      id_assurance,
    };
  }

  private normalizeAdvantages(avantages?: string[]) {
    return (avantages ?? [])
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private serialize(item: {
    id_assurance: string;
    nom: string | null;
    description: string | null;
    qualificatif: string | null;
    avantages: string[];
    prix_jour: Prisma.Decimal | number | null;
  }) {
    return {
      ...item,
      prix_jour: item.prix_jour !== null ? Number(item.prix_jour) : null,
    };
  }

  private async generateAssuranceId(): Promise<string> {
    const lastAssurance = await this.prisma.assurances.findFirst({
      where: {
        id_assurance: {
          startsWith: 'ASS',
        },
      },
      orderBy: {
        id_assurance: 'desc',
      },
      select: {
        id_assurance: true,
      },
    });

    if (!lastAssurance) {
      return 'ASS00000001';
    }

    const lastNumber = Number(lastAssurance.id_assurance.replace('ASS', '')) || 0;
    const nextNumber = lastNumber + 1;

    return `ASS${String(nextNumber).padStart(8, '0')}`;
  }
}