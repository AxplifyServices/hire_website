import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollaborateursService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyEntreprises(user: any) {
    if (!user?.id_client) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return this.prisma.clients_entreprises.findMany({
      where: {
        id_client: user.id_client,
        actif: true,
      },
      orderBy: {
        date_creation: 'asc',
      },
      select: {
        id_client_entreprise: true,
        id_client: true,
        id_entreprise: true,
        id_centre_cout: true,
        id_profil_beneficiaire: true,
        manager_id_client_entreprise: true,
        role_entreprise: true,
        matricule: true,
        actif: true,
        date_creation: true,
        date_dern_maj: true,
        entreprises: {
          select: {
            id_entreprise: true,
            raison_sociale: true,
            slug: true,
            statut: true,
            devise: true,
            mode_validation_defaut: true,
          },
        },
        centres_cout: {
          select: {
            id_centre_cout: true,
            code: true,
            libelle: true,
          },
        },
        profils_beneficiaires: {
          select: {
            id_profil_beneficiaire: true,
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
          },
        },
      },
    });
  }

  async getMyContext(user: any) {
    if (!user?.id_client) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const memberships = await this.prisma.clients_entreprises.findMany({
      where: {
        id_client: user.id_client,
        actif: true,
      },
      orderBy: {
        date_creation: 'asc',
      },
      select: {
        id_client_entreprise: true,
        id_client: true,
        id_entreprise: true,
        id_centre_cout: true,
        id_profil_beneficiaire: true,
        manager_id_client_entreprise: true,
        role_entreprise: true,
        matricule: true,
        actif: true,
        date_creation: true,
        date_dern_maj: true,
        entreprises: {
          select: {
            id_entreprise: true,
            raison_sociale: true,
            slug: true,
            statut: true,
            devise: true,
            mode_validation_defaut: true,
          },
        },
        centres_cout: {
          select: {
            id_centre_cout: true,
            code: true,
            libelle: true,
          },
        },
        profils_beneficiaires: {
          select: {
            id_profil_beneficiaire: true,
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
          },
        },
      },
    });

    return {
      user: {
        id_client: user.id_client,
        mail: user.mail,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        type_client: user.type_client,
      },
      is_b2b: memberships.length > 0,
      memberships,
      default_membership: memberships[0] ?? null,
    };
  }
}