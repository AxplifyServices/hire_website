import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCentreCoutDto } from './dto/update-centre-cout.dto';

@Injectable()
export class CentresCoutService {
  constructor(private readonly prisma: PrismaService) {}

  async updateCentreCout(
    id_centre_cout: string,
    dto: UpdateCentreCoutDto,
  ) {
    const existing = await this.prisma.centres_cout.findUnique({
      where: { id_centre_cout },
      select: {
        id_centre_cout: true,
        id_entreprise: true,
        code: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Centre de coût introuvable.');
    }

    const code = dto.code !== undefined ? dto.code.trim() : undefined;
    const libelle = dto.libelle !== undefined ? dto.libelle.trim() : undefined;

    if (code && code !== existing.code) {
      const duplicate = await this.prisma.centres_cout.findFirst({
        where: {
          id_entreprise: existing.id_entreprise,
          code,
          id_centre_cout: {
            not: id_centre_cout,
          },
        },
        select: {
          id_centre_cout: true,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Un centre de coût existe déjà avec ce code pour cette entreprise.',
        );
      }
    }

    const centre_cout = await this.prisma.centres_cout.update({
      where: { id_centre_cout },
      data: {
        ...(code !== undefined ? { code } : {}),
        ...(libelle !== undefined ? { libelle } : {}),
        ...(dto.actif !== undefined ? { actif: dto.actif } : {}),
        date_dern_maj: new Date(),
      },
      select: {
        id_centre_cout: true,
        id_entreprise: true,
        code: true,
        libelle: true,
        actif: true,
        date_creation: true,
        date_dern_maj: true,
      },
    });

    return {
      message: 'Centre de coût modifié avec succès.',
      centre_cout,
    };
  }

  async removeCentreCout(id_centre_cout: string) {
    const existing = await this.prisma.centres_cout.findUnique({
      where: { id_centre_cout },
      select: {
        id_centre_cout: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Centre de coût introuvable.');
    }

    const [collaborateursCount, reservationsCount] = await Promise.all([
      this.prisma.clients_entreprises.count({
        where: {
          id_centre_cout,
        },
      }),
      this.prisma.reservations_entreprises.count({
        where: {
          id_centre_cout,
        },
      }),
    ]);

    if (collaborateursCount > 0 || reservationsCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer ce centre de coût car il est déjà utilisé par des collaborateurs ou des réservations B2B.',
      );
    }

    await this.prisma.centres_cout.delete({
      where: { id_centre_cout },
    });

    return {
      message: 'Centre de coût supprimé avec succès.',
      id_centre_cout,
    };
  }
}