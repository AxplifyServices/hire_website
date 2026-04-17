import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchVehiculesDto } from './dto/search-vehicules.dto';
import { ListVehiculesDto } from './dto/list-vehicules.dto';

@Injectable()
export class VehiculesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: ListVehiculesDto) {
    if (dto.prix_jour_min !== undefined && dto.prix_jour_max !== undefined) {
      if (dto.prix_jour_max < dto.prix_jour_min) {
        throw new BadRequestException(
          'prix_jour_max doit être supérieur ou égal à prix_jour_min.',
        );
      }
    }

    const page = dto.page;
    const limit = dto.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.vehiculesWhereInput = {
      ...(dto.id_agence_actuelle && {
        id_agence_actuelle: dto.id_agence_actuelle,
      }),
      ...(dto.categorie && {
        categorie: {
          equals: dto.categorie,
          mode: 'insensitive',
        },
      }),
      ...(dto.marque && {
        marque: {
          contains: dto.marque,
          mode: 'insensitive',
        },
      }),
      ...(dto.model && {
        model: {
          contains: dto.model,
          mode: 'insensitive',
        },
      }),
      ...(dto.carburant && {
        carburant: {
          equals: dto.carburant,
          mode: 'insensitive',
        },
      }),
      ...(dto.transmission && {
        transmission: {
          equals: dto.transmission,
          mode: 'insensitive',
        },
      }),
      ...(dto.climatisation !== undefined && {
        climatisation: dto.climatisation === 'true',
      }),
      ...(dto.disponibilite && {
        disponibilite: {
          equals: dto.disponibilite,
          mode: 'insensitive',
        },
      }),
      ...(dto.status_vehicule && {
        status_vehicule: {
          equals: dto.status_vehicule,
          mode: 'insensitive',
        },
      }),
      ...(dto.nb_place_min !== undefined && {
        nb_place: {
          gte: dto.nb_place_min,
        },
      }),
      ...(dto.nb_porte_min !== undefined && {
        nb_porte: {
          gte: dto.nb_porte_min,
        },
      }),
      ...((dto.prix_jour_min !== undefined || dto.prix_jour_max !== undefined) && {
        prix_jour: {
          ...(dto.prix_jour_min !== undefined && { gte: dto.prix_jour_min }),
          ...(dto.prix_jour_max !== undefined && { lte: dto.prix_jour_max }),
        },
      }),
    };

    const sortBy = dto.sort_by ?? 'prix_jour';
    const sortOrder = dto.sort_order ?? 'asc';

    const [total, vehicules] = await Promise.all([
      this.prisma.vehicules.count({ where }),
      this.prisma.vehicules.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
    ]);

    return {
      data: vehicules.map((vehicule) => ({
        ...vehicule,
        prix_jour:
          vehicule.prix_jour !== null ? Number(vehicule.prix_jour) : null,
        capacite_coffre:
          vehicule.capacite_coffre !== null
            ? Number(vehicule.capacite_coffre)
            : null,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
      filters: {
        id_agence_actuelle: dto.id_agence_actuelle ?? null,
        categorie: dto.categorie ?? null,
        marque: dto.marque ?? null,
        model: dto.model ?? null,
        carburant: dto.carburant ?? null,
        transmission: dto.transmission ?? null,
        climatisation: dto.climatisation ?? null,
        disponibilite: dto.disponibilite ?? null,
        status_vehicule: dto.status_vehicule ?? null,
        nb_place_min: dto.nb_place_min ?? null,
        nb_porte_min: dto.nb_porte_min ?? null,
        prix_jour_min: dto.prix_jour_min ?? null,
        prix_jour_max: dto.prix_jour_max ?? null,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    };
  }

  async search(dto: SearchVehiculesDto) {
    const start = this.combineDateAndTime(
      dto.date_dep,
      dto.heure_dep ?? '10:00:00',
    );

    const end = this.combineDateAndTime(
      dto.date_ret,
      dto.heure_ret ?? '10:00:00',
    );

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Dates/heures invalides.');
    }

    if (end <= start) {
      throw new BadRequestException(
        'La date et heure de retour doivent être après la date et heure de départ.',
      );
    }

    let allowedTypes: string[] | null = null;

    if (dto.id_client_entreprise_beneficiaire) {
      const membership = await this.prisma.clients_entreprises.findUnique({
        where: {
          id_client_entreprise: dto.id_client_entreprise_beneficiaire,
        },
        include: {
          profils_beneficiaires: true,
        },
      });

      const profil = membership?.profils_beneficiaires;

      if (profil?.liste_type_autorise && profil.liste_type_autorise.length > 0) {
        allowedTypes = profil.liste_type_autorise;
      }
    }

    const vehicules = await this.prisma.vehicules.findMany({
      where: {
        status_vehicule: {
          equals: 'Actif',
          mode: 'insensitive',
        },
        ...(allowedTypes
          ? {
              type_vehicule: {
                in: allowedTypes,
              },
            }
          : {}),
      },
      orderBy: {
        prix_jour: 'asc',
      },
    });

    return vehicules.map((vehicule) => ({
      ...vehicule,
      prix_jour:
        vehicule.prix_jour !== null ? Number(vehicule.prix_jour) : null,
      capacite_coffre:
        vehicule.capacite_coffre !== null
          ? Number(vehicule.capacite_coffre)
          : null,
    }));
  }

  private combineDateAndTime(dateValue: Date | string, timeValue: string): Date {
    const date =
      dateValue instanceof Date
        ? dateValue.toISOString().slice(0, 10)
        : new Date(dateValue).toISOString().slice(0, 10);

    const time = timeValue.length === 5 ? `${timeValue}:00` : timeValue;

    return new Date(`${date}T${time}`);
  }

  private normalizeTimeValue(value: string | Date | null | undefined): string {
    if (!value) {
      return '10:00:00';
    }

    if (typeof value === 'string') {
      return value;
    }

    return value.toTimeString().slice(0, 8);
  }
}