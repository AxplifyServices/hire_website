import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { SearchVehiculesDto } from './dto/search-vehicules.dto';
import { ListVehiculesDto } from './dto/list-vehicules.dto';
import { CreateVehiculeDto } from './dto/create-vehicule.dto';
import { UpdateVehiculeDto } from './dto/update-vehicule.dto';

const ALLOWED_CATEGORIES = [
      'Citadines',
      'Eco',
      'Berlines',
      'SUV',
      'Premium',
      'Vans',
    ] as const;
const ALLOWED_TRANSMISSIONS = ['Manuelle', 'Automatique'] as const;
const ALLOWED_FUELS = ['Gazoil', 'Essence', 'Electrique', 'Hybride'] as const;
const ALLOWED_STATUSES = ['Actif', 'Maintenance', 'Retire_flotte'] as const;
const ALLOWED_TYPES = ['sm-a', 'sm-b', 'sm-c', 'sm-d', 'sm-e', 'sm-f'] as const;
const ALLOWED_AVAILABILITIES = ['Disponible', 'Reserve', 'Indisponible'] as const;

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

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
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
      data: vehicules.map((vehicule) => this.serializeVehicule(vehicule)),
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

  async findOne(id: string) {
    const vehicule = await this.prisma.vehicules.findUnique({
      where: { id_vehicule: id },
    });

    if (!vehicule) {
      throw new NotFoundException('Véhicule introuvable.');
    }

    return this.serializeVehicule(vehicule);
  }

  async create(dto: CreateVehiculeDto, file?: Express.Multer.File) {
    this.validateVehiculeEnums({
      categorie: dto.categorie,
      transmission: dto.transmission,
      carburant: dto.carburant,
      status_vehicule: dto.status_vehicule,
      type_vehicule: dto.type_vehicule,
      disponibilite: dto.disponibilite,
    });

    await this.assertAgenceExists(dto.id_agence_actuelle);

    const now = new Date();
    const imagePath = file ? this.toStoredPath(file.filename) : null;

    const vehicule = await this.prisma.vehicules.create({
      data: {
        id_vehicule: await this.generateVehiculeId(),
        nom: dto.nom,
        categorie: dto.categorie ?? null,
        transmission: dto.transmission ?? null,
        prix_jour: new Prisma.Decimal(dto.prix_jour),
        carburant: dto.carburant ?? null,
        nb_place: dto.nb_place ?? null,
        nb_porte: dto.nb_porte ?? null,
        climatisation: dto.climatisation ?? null,
        disponibilite: dto.disponibilite ?? 'Disponible',
        model: dto.model ?? null,
        marque: dto.marque ?? null,
        status_vehicule: dto.status_vehicule ?? 'Actif',
        id_agence_actuelle: dto.id_agence_actuelle ?? null,
        url_image_vehicule: imagePath,
        capacite_coffre:
          dto.capacite_coffre !== undefined
            ? new Prisma.Decimal(dto.capacite_coffre)
            : null,
        description: dto.description ?? null,
        type_vehicule: dto.type_vehicule ?? null,
        date_creation: now,
        date_dern_maj: now,
      },
    });

    return {
      message: 'Véhicule créé avec succès.',
      vehicule: this.serializeVehicule(vehicule),
    };
  }

  async update(id: string, dto: UpdateVehiculeDto, file?: Express.Multer.File) {
    const existing = await this.prisma.vehicules.findUnique({
      where: { id_vehicule: id },
    });

    if (!existing) {
      throw new NotFoundException('Véhicule introuvable.');
    }

    this.validateVehiculeEnums({
      categorie: dto.categorie,
      transmission: dto.transmission,
      carburant: dto.carburant,
      status_vehicule: dto.status_vehicule,
      type_vehicule: dto.type_vehicule,
      disponibilite: dto.disponibilite,
    });

    await this.assertAgenceExists(dto.id_agence_actuelle);

    const nextImagePath = file
      ? this.toStoredPath(file.filename)
      : existing.url_image_vehicule;

    const vehicule = await this.prisma.vehicules.update({
      where: { id_vehicule: id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.categorie !== undefined && { categorie: dto.categorie }),
        ...(dto.transmission !== undefined && { transmission: dto.transmission }),
        ...(dto.prix_jour !== undefined && {
          prix_jour: new Prisma.Decimal(dto.prix_jour),
        }),
        ...(dto.carburant !== undefined && { carburant: dto.carburant }),
        ...(dto.nb_place !== undefined && { nb_place: dto.nb_place }),
        ...(dto.nb_porte !== undefined && { nb_porte: dto.nb_porte }),
        ...(dto.climatisation !== undefined && {
          climatisation: dto.climatisation,
        }),
        ...(dto.disponibilite !== undefined && {
          disponibilite: dto.disponibilite,
        }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.marque !== undefined && { marque: dto.marque }),
        ...(dto.status_vehicule !== undefined && {
          status_vehicule: dto.status_vehicule,
        }),
        ...(dto.id_agence_actuelle !== undefined && {
          id_agence_actuelle: dto.id_agence_actuelle,
        }),
        ...(file && { url_image_vehicule: nextImagePath }),
        ...(dto.capacite_coffre !== undefined && {
          capacite_coffre: new Prisma.Decimal(dto.capacite_coffre),
        }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.type_vehicule !== undefined && {
          type_vehicule: dto.type_vehicule,
        }),
        date_dern_maj: new Date(),
      },
    });

    if (file && existing.url_image_vehicule) {
      this.deleteStoredFile(existing.url_image_vehicule);
    }

    return {
      message: 'Véhicule modifié avec succès.',
      vehicule: this.serializeVehicule(vehicule),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.vehicules.findUnique({
      where: { id_vehicule: id },
    });

    if (!existing) {
      throw new NotFoundException('Véhicule introuvable.');
    }

    const [reservationsCount, reservationsEntrepriseCount, avisCount] =
      await this.prisma.$transaction([
        this.prisma.reservations.count({
          where: { id_vehicule: id },
        }),
        this.prisma.reservations_entreprises.count({
          where: { id_vehicule: id },
        }),
        this.prisma.avis.count({
          where: { id_vehicule: id },
        }),
      ]);

    const hasDependencies =
      reservationsCount > 0 ||
      reservationsEntrepriseCount > 0 ||
      avisCount > 0;

    if (hasDependencies) {
      await this.prisma.vehicules.update({
        where: { id_vehicule: id },
        data: {
          status_vehicule: 'Retire_flotte',
          disponibilite: 'Indisponible',
          date_dern_maj: new Date(),
        },
      });

      return {
        message:
          'Le véhicule est lié à un historique existant. Il a été retiré de la flotte au lieu d’être supprimé.',
        deleted: false,
        retired: true,
        dependencies: {
          reservations: reservationsCount,
          reservations_entreprises: reservationsEntrepriseCount,
          avis: avisCount,
        },
      };
    }

    await this.prisma.vehicules.delete({
      where: { id_vehicule: id },
    });

    if (existing.url_image_vehicule) {
      this.deleteStoredFile(existing.url_image_vehicule);
    }

    return {
      message: 'Véhicule supprimé avec succès.',
      deleted: true,
      retired: false,
      dependencies: {
        reservations: 0,
        reservations_entreprises: 0,
        avis: 0,
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
        disponibilite: {
          equals: 'Disponible',
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

    return vehicules.map((vehicule) => this.serializeVehicule(vehicule));
  }

  private validateVehiculeEnums(input: {
    categorie?: string | null;
    transmission?: string | null;
    carburant?: string | null;
    status_vehicule?: string | null;
    type_vehicule?: string | null;
    disponibilite?: string | null;
  }) {
    if (input.categorie && !ALLOWED_CATEGORIES.includes(input.categorie as any)) {
      throw new BadRequestException(
        `Catégorie invalide. Valeurs autorisées : ${ALLOWED_CATEGORIES.join(', ')}`,
      );
    }

    if (
      input.transmission &&
      !ALLOWED_TRANSMISSIONS.includes(input.transmission as any)
    ) {
      throw new BadRequestException(
        `Transmission invalide. Valeurs autorisées : ${ALLOWED_TRANSMISSIONS.join(', ')}`,
      );
    }

    if (input.carburant && !ALLOWED_FUELS.includes(input.carburant as any)) {
      throw new BadRequestException(
        `Carburant invalide. Valeurs autorisées : ${ALLOWED_FUELS.join(', ')}`,
      );
    }

    if (
      input.status_vehicule &&
      !ALLOWED_STATUSES.includes(input.status_vehicule as any)
    ) {
      throw new BadRequestException(
        `Statut véhicule invalide. Valeurs autorisées : ${ALLOWED_STATUSES.join(', ')}`,
      );
    }

    if (input.type_vehicule && !ALLOWED_TYPES.includes(input.type_vehicule as any)) {
      throw new BadRequestException(
        `Type véhicule invalide. Valeurs autorisées : ${ALLOWED_TYPES.join(', ')}`,
      );
    }

    if (
      input.disponibilite &&
      !ALLOWED_AVAILABILITIES.includes(input.disponibilite as any)
    ) {
      throw new BadRequestException(
        `Disponibilité invalide. Valeurs autorisées : ${ALLOWED_AVAILABILITIES.join(', ')}`,
      );
    }
  }

  private serializeVehicule(vehicule: any) {
    return {
      ...vehicule,
      prix_jour:
        vehicule.prix_jour !== null ? Number(vehicule.prix_jour) : null,
      capacite_coffre:
        vehicule.capacite_coffre !== null
          ? Number(vehicule.capacite_coffre)
          : null,
    };
  }

  private combineDateAndTime(dateValue: Date | string, timeValue: string): Date {
    const date =
      dateValue instanceof Date
        ? dateValue.toISOString().slice(0, 10)
        : new Date(dateValue).toISOString().slice(0, 10);

    const time = timeValue.length === 5 ? `${timeValue}:00` : timeValue;

    return new Date(`${date}T${time}`);
  }

  private toStoredPath(filename: string) {
    return `/storage/vehicules/${filename}`;
  }

  private deleteStoredFile(relativePath: string) {
    const normalized = relativePath.replace(/^\/+/, '');
    const absolutePath = join(process.cwd(), normalized);

    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
    }
  }

  private async assertAgenceExists(idAgence?: string | null) {
    if (!idAgence) {
      return;
    }

    const agence = await this.prisma.agences.findUnique({
      where: { id_agence: idAgence },
      select: { id_agence: true },
    });

    if (!agence) {
      throw new BadRequestException("L'agence sélectionnée est introuvable.");
    }
  }

  private async generateVehiculeId() {
    for (let i = 0; i < 20; i++) {
      const random = Math.floor(10000000 + Math.random() * 90000000);
      const id = `VEH${random}`;

      const exists = await this.prisma.vehicules.findUnique({
        where: { id_vehicule: id },
        select: { id_vehicule: true },
      });

      if (!exists) {
        return id;
      }
    }

    throw new BadRequestException(
      "Impossible de générer un identifiant véhicule unique.",
    );
  }
}