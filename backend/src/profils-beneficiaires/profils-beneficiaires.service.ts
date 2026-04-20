import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfilBeneficiaireDto } from './dto/update-profil-beneficiaire.dto';

@Injectable()
export class ProfilsBeneficiairesService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfilBeneficiaire(
    id_profil_beneficiaire: string,
    dto: UpdateProfilBeneficiaireDto,
  ) {
    const profil = await this.prisma.profils_beneficiaires.findUnique({
      where: { id_profil_beneficiaire },
      select: {
        id_profil_beneficiaire: true,
        id_entreprise: true,
        code: true,
      },
    });

    if (!profil) {
      throw new NotFoundException('Profil bénéficiaire introuvable.');
    }

    const code = dto.code !== undefined ? dto.code.trim() : undefined;
    const libelle = dto.libelle !== undefined ? dto.libelle.trim() : undefined;
    const description =
      dto.description !== undefined ? dto.description?.trim() || null : undefined;

    if (code && code !== profil.code) {
      const duplicate = await this.prisma.profils_beneficiaires.findFirst({
        where: {
          id_entreprise: profil.id_entreprise,
          code,
          id_profil_beneficiaire: {
            not: id_profil_beneficiaire,
          },
        },
        select: {
          id_profil_beneficiaire: true,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Un profil bénéficiaire existe déjà avec ce code pour cette entreprise.',
        );
      }
    }

    const updated = await this.prisma.profils_beneficiaires.update({
      where: { id_profil_beneficiaire },
      data: {
        ...(code !== undefined ? { code } : {}),
        ...(libelle !== undefined ? { libelle } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(dto.validation_requise !== undefined
          ? { validation_requise: dto.validation_requise }
          : {}),
        ...(dto.budget_plafond_mensuel !== undefined
          ? { budget_plafond_mensuel: dto.budget_plafond_mensuel }
          : {}),
        ...(dto.nb_jours_mois !== undefined
          ? { nb_jours_mois: dto.nb_jours_mois }
          : {}),
        ...(dto.nb_reservations_simultanees !== undefined
          ? {
              nb_reservations_simultanees: dto.nb_reservations_simultanees,
            }
          : {}),
        ...(dto.avec_chauffeur_autorise !== undefined
          ? { avec_chauffeur_autorise: dto.avec_chauffeur_autorise }
          : {}),
        ...(dto.sans_chauffeur_autorise !== undefined
          ? { sans_chauffeur_autorise: dto.sans_chauffeur_autorise }
          : {}),
        ...(dto.liste_type_autorise !== undefined
          ? { liste_type_autorise: dto.liste_type_autorise }
          : {}),
        ...(dto.actif !== undefined ? { actif: dto.actif } : {}),
        date_dern_maj: new Date(),
      },
      select: {
        id_profil_beneficiaire: true,
        id_entreprise: true,
        code: true,
        libelle: true,
        description: true,
        validation_requise: true,
        budget_plafond_mensuel: true,
        nb_jours_mois: true,
        nb_reservations_simultanees: true,
        avec_chauffeur_autorise: true,
        sans_chauffeur_autorise: true,
        actif: true,
        date_creation: true,
        date_dern_maj: true,
        liste_type_autorise: true,
      },
    });

    return {
      message: 'Profil bénéficiaire modifié avec succès.',
      profil_beneficiaire: updated,
    };
  }

  async removeProfilBeneficiaire(id_profil_beneficiaire: string) {
    const profil = await this.prisma.profils_beneficiaires.findUnique({
      where: { id_profil_beneficiaire },
      select: {
        id_profil_beneficiaire: true,
      },
    });

    if (!profil) {
      throw new NotFoundException('Profil bénéficiaire introuvable.');
    }

    const [collaborateursCount, reservationsCount] = await Promise.all([
      this.prisma.clients_entreprises.count({
        where: {
          id_profil_beneficiaire,
        },
      }),
      this.prisma.reservations_entreprises.count({
        where: {
          id_profil_beneficiaire,
        },
      }),
    ]);

    if (collaborateursCount > 0 || reservationsCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer ce profil bénéficiaire car il est déjà utilisé par des collaborateurs ou des réservations B2B.',
      );
    }

    await this.prisma.profils_beneficiaires.delete({
      where: { id_profil_beneficiaire },
    });

    return {
      message: 'Profil bénéficiaire supprimé avec succès.',
      id_profil_beneficiaire,
    };
  }
}