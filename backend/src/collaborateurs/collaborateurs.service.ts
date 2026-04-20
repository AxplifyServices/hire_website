import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCollaborateurDto } from './dto/update-collaborateur.dto';
import * as bcrypt from 'bcrypt';

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
            liste_type_autorise: true,
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
            liste_type_autorise: true,
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

  async updateCollaborateur(
    id_client_entreprise: string,
    dto: UpdateCollaborateurDto,
  ) {
    const membership = await this.prisma.clients_entreprises.findUnique({
      where: { id_client_entreprise },
      select: {
        id_client_entreprise: true,
        id_client: true,
        id_entreprise: true,
        manager_id_client_entreprise: true,
        clients: {
          select: {
            id_client: true,
            mail: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Collaborateur introuvable.');
    }

    const now = new Date();

    const centreCoutId =
      dto.id_centre_cout !== undefined
        ? dto.id_centre_cout
          ? dto.id_centre_cout.trim() || null
          : null
        : undefined;

    const profilBeneficiaireId =
      dto.id_profil_beneficiaire !== undefined
        ? dto.id_profil_beneficiaire
          ? dto.id_profil_beneficiaire.trim() || null
          : null
        : undefined;

    const managerMembershipId =
      dto.manager_id_client_entreprise !== undefined
        ? dto.manager_id_client_entreprise
          ? dto.manager_id_client_entreprise.trim() || null
          : null
        : undefined;

    if (centreCoutId) {
      const centre = await this.prisma.centres_cout.findFirst({
        where: {
          id_centre_cout: centreCoutId,
          id_entreprise: membership.id_entreprise,
        },
        select: { id_centre_cout: true },
      });

      if (!centre) {
        throw new BadRequestException(
          'Le centre de coût ne correspond pas à cette entreprise.',
        );
      }
    }

    if (profilBeneficiaireId) {
      const profil = await this.prisma.profils_beneficiaires.findFirst({
        where: {
          id_profil_beneficiaire: profilBeneficiaireId,
          id_entreprise: membership.id_entreprise,
        },
        select: { id_profil_beneficiaire: true },
      });

      if (!profil) {
        throw new BadRequestException(
          'Le profil bénéficiaire ne correspond pas à cette entreprise.',
        );
      }
    }

    let resolvedManagerId: string | null | undefined = undefined;

    if (dto.validateur === 'self') {
      resolvedManagerId = membership.id_client_entreprise;
    }

    if (dto.validateur === 'autre') {
      if (!managerMembershipId) {
        throw new BadRequestException(
          'Le manager est obligatoire quand validateur = autre.',
        );
      }

      if (managerMembershipId === membership.id_client_entreprise) {
        throw new BadRequestException(
          'Le valideur doit être différent du collaborateur quand validateur = autre.',
        );
      }

      const validateur = await this.prisma.clients_entreprises.findFirst({
        where: {
          id_client_entreprise: managerMembershipId,
          id_entreprise: membership.id_entreprise,
          actif: true,
        },
        select: {
          id_client_entreprise: true,
        },
      });

      if (!validateur) {
        throw new BadRequestException(
          'Le valideur sélectionné doit être un collaborateur actif de la même entreprise.',
        );
      }

      resolvedManagerId = managerMembershipId;
    }

    if (dto.mail !== undefined) {
      const newMail = dto.mail.trim().toLowerCase();

      if (!newMail) {
        throw new BadRequestException('L’adresse email est obligatoire.');
      }

      const existingClient = await this.prisma.clients.findUnique({
        where: { mail: newMail },
        select: { id_client: true },
      });

      if (
        existingClient &&
        existingClient.id_client !== membership.id_client
      ) {
        throw new ConflictException(
          'Un autre client existe déjà avec cette adresse email.',
        );
      }
    }

    const clientData: Record<string, any> = {};

    if (dto.nom !== undefined) {
      clientData.nom = dto.nom.trim();
    }

    if (dto.prenom !== undefined) {
      clientData.prenom = dto.prenom.trim();
    }

    if (dto.mail !== undefined) {
      clientData.mail = dto.mail.trim().toLowerCase();
    }

    if (dto.prefixe_tel !== undefined) {
      clientData.prefixe_tel = dto.prefixe_tel.trim() || null;
    }

    if (dto.num_tel !== undefined) {
      clientData.num_tel = dto.num_tel.trim() || null;
    }

    if (dto.pays !== undefined) {
      clientData.pays = dto.pays.trim() || null;
    }

    if (dto.language_favori !== undefined) {
      clientData.language_favori = dto.language_favori.trim() || null;
    }

    if (dto.date_naissance !== undefined) {
      clientData.date_naissance = dto.date_naissance
        ? new Date(dto.date_naissance)
        : null;
    }

    if (dto.password !== undefined) {
      const password = dto.password.trim();

      if (!password) {
        throw new BadRequestException(
          'Le mot de passe ne peut pas être vide.',
        );
      }

      clientData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(clientData).length > 0) {
      clientData.date_dern_maj = now;

      await this.prisma.clients.update({
        where: {
          id_client: membership.id_client,
        },
        data: clientData,
      });
    }

    const membershipData: Record<string, any> = {
      date_dern_maj: now,
    };

    if (centreCoutId !== undefined) {
      membershipData.id_centre_cout = centreCoutId;
    }

    if (profilBeneficiaireId !== undefined) {
      membershipData.id_profil_beneficiaire = profilBeneficiaireId;
    }

    if (resolvedManagerId !== undefined) {
      membershipData.manager_id_client_entreprise = resolvedManagerId;
    }

    if (dto.role_entreprise !== undefined) {
      membershipData.role_entreprise = dto.role_entreprise.trim();
    }

    if (dto.matricule !== undefined) {
      membershipData.matricule = dto.matricule.trim() || null;
    }

    if (dto.actif !== undefined) {
      membershipData.actif = dto.actif;
    }

    const collaborateur = await this.prisma.clients_entreprises.update({
      where: {
        id_client_entreprise,
      },
      data: membershipData,
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
        clients: {
          select: {
            id_client: true,
            nom: true,
            prenom: true,
            mail: true,
            pays: true,
            prefixe_tel: true,
            num_tel: true,
            date_naissance: true,
            language_favori: true,
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
            liste_type_autorise: true,
          },
        },
      },
    });

    return {
      message: 'Collaborateur entreprise modifié avec succès.',
      collaborateur,
    };
  }

  async removeCollaborateur(id_client_entreprise: string) {
    const membership = await this.prisma.clients_entreprises.findUnique({
      where: { id_client_entreprise },
      select: {
        id_client_entreprise: true,
        id_client: true,
        id_entreprise: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Collaborateur introuvable.');
    }

    const [
      managedCollaborateursCount,
      quotasCount,
      demandesCommeDemandeurCount,
      demandesCommeValideurCount,
      reservationsCommeDemandeurCount,
      reservationsCommeBeneficiaireCount,
    ] = await Promise.all([
      this.prisma.clients_entreprises.count({
        where: {
          manager_id_client_entreprise: id_client_entreprise,
          id_client_entreprise: {
            not: id_client_entreprise,
          },
        },
      }),
      this.prisma.quotas_clients_entreprises.count({
        where: {
          id_client_entreprise,
        },
      }),
      this.prisma.demandes_validation.count({
        where: {
          id_client_entreprise_demandeur: id_client_entreprise,
        },
      }),
      this.prisma.demandes_validation.count({
        where: {
          id_client_entreprise_valideur: id_client_entreprise,
        },
      }),
      this.prisma.reservations_entreprises.count({
        where: {
          id_client_entreprise_demandeur: id_client_entreprise,
        },
      }),
      this.prisma.reservations_entreprises.count({
        where: {
          id_client_entreprise_beneficiaire: id_client_entreprise,
        },
      }),
    ]);

    if (managedCollaborateursCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer ce collaborateur car il est utilisé comme valideur pour un ou plusieurs autres collaborateurs.'
      );
    }

    const hasDependencies =
      quotasCount > 0 ||
      demandesCommeDemandeurCount > 0 ||
      demandesCommeValideurCount > 0 ||
      reservationsCommeDemandeurCount > 0 ||
      reservationsCommeBeneficiaireCount > 0;

    if (hasDependencies) {
      throw new BadRequestException(
        'Impossible de supprimer ce collaborateur car il est déjà lié à des quotas, validations ou réservations B2B.'
      );
    }

    await this.prisma.clients_entreprises.delete({
      where: { id_client_entreprise },
    });

    return {
      message: 'Collaborateur supprimé avec succès.',
      id_client_entreprise,
    };
}
}