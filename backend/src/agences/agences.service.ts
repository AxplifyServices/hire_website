import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgenceDto } from './dto/create-agence.dto';
import { UpdateAgenceDto } from './dto/update-agence.dto';

@Injectable()
export class AgencesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.agences.findMany({
      where: { is_active: true },
      orderBy: [{ ville: 'asc' }, { nom: 'asc' }],
    });
  }

  async findOne(id_agence: string) {
    const agence = await this.prisma.agences.findUnique({
      where: { id_agence },
    });

    if (!agence) {
      throw new NotFoundException('Agence introuvable.');
    }

    return agence;
  }

  async create(dto: CreateAgenceDto, file?: Express.Multer.File) {
    await this.assertMailAvailable(dto.mail);

    const now = new Date();
    const imagePath = file ? this.toStoredPath(file.filename) : null;

    const agence = await this.prisma.agences.create({
      data: {
        id_agence: await this.generateAgenceId(),
        ville: dto.ville?.trim() || null,
        nom: dto.nom?.trim() || null,
        num_tel: dto.num_tel?.trim() || null,
        num_tel_deux: dto.num_tel_deux?.trim() || null,
        mail: dto.mail?.trim() || null,
        disponibilite_agence: dto.disponibilite_agence?.trim() || null,
        adresse: dto.adresse?.trim() || null,
        url_image_agence: imagePath,
        latitude: this.toDecimalOrNull(dto.latitude),
        longitude: this.toDecimalOrNull(dto.longitude),
        description: dto.description?.trim() || null,
        is_active: true,
        date_creation: now,
        date_dern_maj: now,
        categorie: dto.categorie?.trim() || 'Ville',
      },
    });

    return {
      message: 'Agence créée avec succès.',
      agence,
    };
  }

  async update(
    id_agence: string,
    dto: UpdateAgenceDto,
    file?: Express.Multer.File,
  ) {
    const existing = await this.prisma.agences.findUnique({
      where: { id_agence },
    });

    if (!existing) {
      throw new NotFoundException('Agence introuvable.');
    }

    await this.assertMailAvailable(dto.mail, id_agence);

    const nextImagePath = file
      ? this.toStoredPath(file.filename)
      : existing.url_image_agence;

    const agence = await this.prisma.agences.update({
      where: { id_agence },
      data: {
        ...(dto.ville !== undefined && { ville: dto.ville?.trim() || null }),
        ...(dto.nom !== undefined && { nom: dto.nom?.trim() || null }),
        ...(dto.num_tel !== undefined && { num_tel: dto.num_tel?.trim() || null }),
        ...(dto.num_tel_deux !== undefined && {
          num_tel_deux: dto.num_tel_deux?.trim() || null,
        }),
        ...(dto.mail !== undefined && { mail: dto.mail?.trim() || null }),
        ...(dto.disponibilite_agence !== undefined && {
          disponibilite_agence: dto.disponibilite_agence?.trim() || null,
        }),
        ...(dto.adresse !== undefined && {
          adresse: dto.adresse?.trim() || null,
        }),
        ...(file && { url_image_agence: nextImagePath }),
        ...(dto.latitude !== undefined && {
          latitude: this.toDecimalOrNull(dto.latitude),
        }),
        ...(dto.longitude !== undefined && {
          longitude: this.toDecimalOrNull(dto.longitude),
        }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),
        ...(dto.categorie !== undefined && {
          categorie: dto.categorie?.trim() || 'Ville',
        }),
        date_dern_maj: new Date(),
      },
    });

    if (file && existing.url_image_agence) {
      this.deleteStoredFile(existing.url_image_agence);
    }

    return {
      message: 'Agence modifiée avec succès.',
      agence,
    };
  }

  async remove(id_agence: string) {
    const existing = await this.prisma.agences.findUnique({
      where: { id_agence },
    });

    if (!existing) {
      throw new NotFoundException('Agence introuvable.');
    }

    const [
      newsCount,
      vehiculesCount,
      reservationsDepartCount,
      reservationsRetourCount,
      reservationsEntrepriseDepartCount,
      reservationsEntrepriseRetourCount,
    ] = await this.prisma.$transaction([
      this.prisma.news.count({ where: { id_agence } }),
      this.prisma.vehicules.count({ where: { id_agence_actuelle: id_agence } }),
      this.prisma.reservations.count({ where: { id_lieu_dep: id_agence } }),
      this.prisma.reservations.count({ where: { id_lieu_ret: id_agence } }),
      this.prisma.reservations_entreprises.count({
        where: { id_agence_depart: id_agence },
      }),
      this.prisma.reservations_entreprises.count({
        where: { id_agence_retour: id_agence },
      }),
    ]);

    const hasDependencies =
      newsCount > 0 ||
      vehiculesCount > 0 ||
      reservationsDepartCount > 0 ||
      reservationsRetourCount > 0 ||
      reservationsEntrepriseDepartCount > 0 ||
      reservationsEntrepriseRetourCount > 0;

    if (hasDependencies) {
      await this.prisma.agences.update({
        where: { id_agence },
        data: {
          is_active: false,
          date_dern_maj: new Date(),
        },
      });

      return {
        message:
          'L’agence est liée à un historique existant. Elle a été désactivée au lieu d’être supprimée.',
        deleted: false,
        deactivated: true,
        dependencies: {
          news: newsCount,
          vehicules: vehiculesCount,
          reservations_depart: reservationsDepartCount,
          reservations_retour: reservationsRetourCount,
          reservations_entreprises_depart: reservationsEntrepriseDepartCount,
          reservations_entreprises_retour: reservationsEntrepriseRetourCount,
        },
      };
    }

    await this.prisma.agences.delete({
      where: { id_agence },
    });

    if (existing.url_image_agence) {
      this.deleteStoredFile(existing.url_image_agence);
    }

    return {
      message: 'Agence supprimée avec succès.',
      deleted: true,
      deactivated: false,
      dependencies: {
        news: 0,
        vehicules: 0,
        reservations_depart: 0,
        reservations_retour: 0,
        reservations_entreprises_depart: 0,
        reservations_entreprises_retour: 0,
      },
    };
  }

  private async assertMailAvailable(mail?: string | null, excludeId?: string) {
    const normalizedMail = mail?.trim();

    if (!normalizedMail) {
      return;
    }

    const existing = await this.prisma.agences.findFirst({
      where: {
        mail: normalizedMail,
        ...(excludeId
          ? {
              NOT: {
                id_agence: excludeId,
              },
            }
          : {}),
      },
      select: {
        id_agence: true,
      },
    });

    if (existing) {
      throw new BadRequestException('Une agence utilise déjà cet email.');
    }
  }

  private toDecimalOrNull(value?: string | null) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const normalized = String(value).trim();

    if (!normalized) {
      return null;
    }

    return new Prisma.Decimal(normalized);
  }

  private toStoredPath(filename: string) {
    return `/storage/agences/${filename}`;
  }

  private deleteStoredFile(pathValue: string) {
    const relativePath = pathValue.replace(/^\/+/, '');
    const absolutePath = join(process.cwd(), relativePath);

    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
    }
  }

  private async generateAgenceId() {
    const lastAgence = await this.prisma.agences.findFirst({
      where: {
        id_agence: {
          startsWith: 'AGC',
        },
      },
      orderBy: {
        id_agence: 'desc',
      },
      select: {
        id_agence: true,
      },
    });

    if (!lastAgence) {
      return 'AGC00000001';
    }

    const lastNumber = Number(lastAgence.id_agence.replace('AGC', '')) || 0;
    const nextNumber = lastNumber + 1;

    return `AGC${String(nextNumber).padStart(8, '0')}`;
  }
}