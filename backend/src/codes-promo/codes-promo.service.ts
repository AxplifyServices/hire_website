import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListCodesPromoDto } from './dto/list-codes-promo.dto';
import { CreateCodePromoDto } from './dto/create-code-promo.dto';
import { UpdateCodePromoDto } from './dto/update-code-promo.dto';

@Injectable()
export class CodesPromoService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: ListCodesPromoDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = dto.sort_by ?? 'date_creation';
    const sortOrder = dto.sort_order ?? 'desc';
    const search = dto.search?.trim();

    const where: Prisma.codes_promoWhereInput = {
      ...(search
        ? {
            OR: [
              { id_coupon: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(dto.status
        ? {
            status: {
              equals: dto.status,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(dto.type_promo
        ? {
            type_promo: {
              equals: dto.type_promo,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [total, coupons] = await Promise.all([
      this.prisma.codes_promo.count({ where }),
      this.prisma.codes_promo.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          admins: {
            select: {
              id_admin: true,
              nom: true,
              prenom: true,
              mail: true,
            },
          },
        },
      }),
    ]);

    return {
      data: coupons,
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
        status: dto.status ?? null,
        type_promo: dto.type_promo ?? null,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    };
  }

  async findOne(id_coupon: string) {
    const coupon = await this.prisma.codes_promo.findUnique({
      where: { id_coupon },
      include: {
        admins: {
          select: {
            id_admin: true,
            nom: true,
            prenom: true,
            mail: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon introuvable.');
    }

    return coupon;
  }

  async create(dto: CreateCodePromoDto, user: any) {
    const normalizedCode = dto.code.trim().toUpperCase();

    const existing = await this.prisma.codes_promo.findUnique({
      where: { code: normalizedCode },
      select: { id_coupon: true },
    });

    if (existing) {
      throw new ConflictException('Un coupon existe déjà avec ce code.');
    }

    if (dto.type_promo === 'Pourcentage' && dto.valeur_promo > 100) {
      throw new BadRequestException(
        'Un coupon en pourcentage ne peut pas dépasser 100.',
      );
    }

    const now = new Date();

    const coupon = await this.prisma.codes_promo.create({
      data: {
        id_coupon: await this.generateCouponId(),
        code: normalizedCode,
        type_promo: dto.type_promo,
        valeur_promo: dto.valeur_promo,
        status: dto.status,
        date_creation: now,
        date_fin_validite: dto.date_fin_validite
          ? new Date(dto.date_fin_validite)
          : null,
        id_admin_createur: user?.id_admin ?? null,
        nb_max_utilisation: dto.nb_max_utilisation ?? null,
        count_use: 0,
      },
      include: {
        admins: {
          select: {
            id_admin: true,
            nom: true,
            prenom: true,
            mail: true,
          },
        },
      },
    });

    return {
      message: 'Coupon créé avec succès.',
      coupon,
    };
  }

  async update(id_coupon: string, dto: UpdateCodePromoDto) {
    const existing = await this.prisma.codes_promo.findUnique({
      where: { id_coupon },
      select: {
        id_coupon: true,
        code: true,
        count_use: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Coupon introuvable.');
    }

    let normalizedCode: string | undefined;

    if (dto.code !== undefined) {
      normalizedCode = dto.code.trim().toUpperCase();

      const owner = await this.prisma.codes_promo.findUnique({
        where: { code: normalizedCode },
        select: { id_coupon: true },
      });

      if (owner && owner.id_coupon !== id_coupon) {
        throw new ConflictException('Un coupon existe déjà avec ce code.');
      }
    }

    const current = await this.prisma.codes_promo.findUnique({
      where: { id_coupon },
      select: { type_promo: true },
    });

    const finalTypePromo = dto.type_promo ?? current?.type_promo ?? undefined;
    const finalValeurPromo = dto.valeur_promo;

    if (
      finalTypePromo === 'Pourcentage' &&
      finalValeurPromo !== undefined &&
      finalValeurPromo > 100
    ) {
      throw new BadRequestException(
        'Un coupon en pourcentage ne peut pas dépasser 100.',
      );
    }

    if (
      dto.nb_max_utilisation !== undefined &&
      dto.nb_max_utilisation !== null &&
      dto.nb_max_utilisation < existing.count_use
    ) {
      throw new BadRequestException(
        "Le maximum d'utilisations ne peut pas être inférieur au nombre déjà consommé.",
      );
    }

    const coupon = await this.prisma.codes_promo.update({
      where: { id_coupon },
      data: {
        ...(normalizedCode !== undefined ? { code: normalizedCode } : {}),
        ...(dto.type_promo !== undefined ? { type_promo: dto.type_promo } : {}),
        ...(dto.valeur_promo !== undefined
          ? { valeur_promo: dto.valeur_promo }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.date_fin_validite !== undefined
          ? {
              date_fin_validite: dto.date_fin_validite
                ? new Date(dto.date_fin_validite)
                : null,
            }
          : {}),
        ...(dto.nb_max_utilisation !== undefined
          ? { nb_max_utilisation: dto.nb_max_utilisation }
          : {}),
      },
      include: {
        admins: {
          select: {
            id_admin: true,
            nom: true,
            prenom: true,
            mail: true,
          },
        },
      },
    });

    return {
      message: 'Coupon modifié avec succès.',
      coupon,
    };
  }

  async remove(id_coupon: string) {
    const existing = await this.prisma.codes_promo.findUnique({
      where: { id_coupon },
      select: {
        id_coupon: true,
        code: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Coupon introuvable.');
    }

    await this.prisma.codes_promo.delete({
      where: { id_coupon },
    });

    return {
      message: 'Coupon supprimé avec succès.',
      id_coupon,
    };
  }

  async findByCode(code: string) {
    if (!code) return null;

    return this.prisma.codes_promo.findFirst({
      where: {
        code: code.trim(),
      },
    });
  }

  async validatePromo(code: string) {
    if (!code) return null;

    const promo = await this.findByCode(code);

    if (!promo) {
      throw new NotFoundException('Code promo invalide');
    }

    if (promo.status !== 'Valide') {
      throw new BadRequestException('Code promo inactif');
    }

    if (promo.date_fin_validite && new Date(promo.date_fin_validite) < new Date()) {
      throw new BadRequestException('Code promo expiré');
    }

    if (
      promo.nb_max_utilisation !== null &&
      promo.count_use >= promo.nb_max_utilisation
    ) {
      throw new BadRequestException('Code promo épuisé');
    }

    return promo;
  }

  computeDiscount(promo: any, montant: number): number {
    if (!promo) return 0;

    let discount = 0;

    if (promo.type_promo === 'Pourcentage') {
      discount = (montant * Number(promo.valeur_promo)) / 100;
    }

    if (promo.type_promo === 'Fixe') {
      discount = Number(promo.valeur_promo);
    }

    if (discount > montant) {
      discount = montant;
    }

    return discount;
  }

  async incrementUsage(code: string) {
    if (!code) return;

    const promo = await this.findByCode(code);

    if (!promo) return;

    await this.prisma.codes_promo.update({
      where: { id_coupon: promo.id_coupon },
      data: {
        count_use: {
          increment: 1,
        },
      },
    });
  }

  private async generateCouponId(): Promise<string> {
    const lastCoupon = await this.prisma.codes_promo.findFirst({
      where: {
        id_coupon: {
          startsWith: 'CPN',
        },
      },
      orderBy: {
        id_coupon: 'desc',
      },
      select: {
        id_coupon: true,
      },
    });

    if (!lastCoupon) {
      return 'CPN00000001';
    }

    const lastNumber = Number(lastCoupon.id_coupon.replace('CPN', '')) || 0;
    const nextNumber = lastNumber + 1;

    return `CPN${String(nextNumber).padStart(8, '0')}`;
  }
}