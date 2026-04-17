import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto';
import { CreateCollaborateurDto } from './dto/create-collaborateur.dto';
import * as bcrypt from 'bcrypt';
import { CreateCentreCoutDto } from './dto/create-centre-cout.dto';
import { CreateProfilBeneficiaireDto } from './dto/create-profil-beneficiaire.dto';

@Injectable()
export class EntreprisesService {
  constructor(private readonly prisma: PrismaService) {}

  async createEntreprise(dto: CreateEntrepriseDto) {
    const raison_sociale = dto.raison_sociale.trim();
    const slug = dto.slug.trim().toLowerCase();
    const email_contact = dto.email_contact?.trim().toLowerCase() ?? null;
    const now = new Date();

    const existingByRaisonSociale = await this.prisma.entreprises.findFirst({
      where: { raison_sociale },
      select: { id_entreprise: true },
    });

    if (existingByRaisonSociale) {
      throw new ConflictException(
        'Une entreprise existe déjà avec cette raison sociale.',
      );
    }

    const existingBySlug = await this.prisma.entreprises.findFirst({
      where: { slug },
      select: { id_entreprise: true },
    });

    if (existingBySlug) {
      throw new ConflictException('Une entreprise existe déjà avec ce slug.');
    }

    const entreprise = await this.prisma.entreprises.create({
      data: {
        id_entreprise: await this.generateNextEntrepriseId(),
        raison_sociale,
        slug,
        email_contact,
        tel_contact: dto.tel_contact ?? null,
        statut: dto.statut ?? 'actif',
        mode_validation_defaut: dto.mode_validation_defaut ?? 'manuelle',
        devise: dto.devise ?? 'MAD',
        date_creation: now,
        date_dern_maj: now,
      },
      select: {
        id_entreprise: true,
        raison_sociale: true,
        slug: true,
        email_contact: true,
        tel_contact: true,
        statut: true,
        mode_validation_defaut: true,
        devise: true,
        date_creation: true,
        date_dern_maj: true,
      },
    });

    return {
      message: 'Entreprise créée avec succès.',
      entreprise,
    };
  }

  async createCentreCout(id_entreprise: string, dto: CreateCentreCoutDto) {
    const entreprise = await this.prisma.entreprises.findUnique({
      where: { id_entreprise },
      select: {
        id_entreprise: true,
        raison_sociale: true,
      },
    });

    if (!entreprise) {
      throw new NotFoundException('Entreprise introuvable.');
    }

    const code = dto.code.trim();
    const libelle = dto.libelle.trim();
    const now = new Date();

    const existing = await this.prisma.centres_cout.findFirst({
      where: {
        id_entreprise,
        code,
      },
      select: {
        id_centre_cout: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Un centre de coût existe déjà avec ce code pour cette entreprise.',
      );
    }

    const centre_cout = await this.prisma.centres_cout.create({
      data: {
        id_centre_cout: await this.generateNextCentreCoutId(),
        id_entreprise,
        code,
        libelle,
        actif: dto.actif ?? true,
        date_creation: now,
        date_dern_maj: now,
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
      message: 'Centre de coût créé avec succès.',
      entreprise,
      centre_cout,
    };
  }

  async createProfilBeneficiaire(
    id_entreprise: string,
    dto: CreateProfilBeneficiaireDto,
  ) {
    const entreprise = await this.prisma.entreprises.findUnique({
      where: { id_entreprise },
      select: {
        id_entreprise: true,
        raison_sociale: true,
      },
    });

    if (!entreprise) {
      throw new NotFoundException('Entreprise introuvable.');
    }

    const code = dto.code.trim();
    const libelle = dto.libelle.trim();
    const now = new Date();

    const existing = await this.prisma.profils_beneficiaires.findFirst({
      where: {
        id_entreprise,
        code,
      },
      select: {
        id_profil_beneficiaire: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Un profil bénéficiaire existe déjà avec ce code pour cette entreprise.',
      );
    }

    const profil_beneficiaire =
      await this.prisma.profils_beneficiaires.create({
        data: {
          id_profil_beneficiaire:
            await this.generateNextProfilBeneficiaireId(),
          id_entreprise,
          code,
          libelle,
          description: dto.description ?? null,
          validation_requise: dto.validation_requise ?? false,
          budget_plafond_mensuel: dto.budget_plafond_mensuel ?? null,
          nb_jours_mois: dto.nb_jours_mois ?? null,
          nb_reservations_simultanees:
            dto.nb_reservations_simultanees ?? null,
          avec_chauffeur_autorise: dto.avec_chauffeur_autorise ?? false,
          sans_chauffeur_autorise: dto.sans_chauffeur_autorise ?? true,
          liste_type_autorise: dto.liste_type_autorise ?? [],
          actif: dto.actif ?? true,
          date_creation: now,
          date_dern_maj: now,
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
      message: 'Profil bénéficiaire créé avec succès.',
      entreprise,
      profil_beneficiaire,
    };
  }

  async createCollaborateur(
    id_entreprise: string,
    dto: CreateCollaborateurDto,
  ) {
    const entreprise = await this.prisma.entreprises.findUnique({
      where: { id_entreprise },
      select: {
        id_entreprise: true,
        raison_sociale: true,
      },
    });

    if (!entreprise) {
      throw new NotFoundException('Entreprise introuvable.');
    }

    const email = dto.mail.trim().toLowerCase();
    const now = new Date();

    if (dto.id_centre_cout) {
      const centre = await this.prisma.centres_cout.findFirst({
        where: {
          id_centre_cout: dto.id_centre_cout,
          id_entreprise,
        },
        select: { id_centre_cout: true },
      });

      if (!centre) {
        throw new BadRequestException(
          'Le centre de coût ne correspond pas à cette entreprise.',
        );
      }
    }

    if (dto.id_profil_beneficiaire) {
      const profil = await this.prisma.profils_beneficiaires.findFirst({
        where: {
          id_profil_beneficiaire: dto.id_profil_beneficiaire,
          id_entreprise,
        },
        select: { id_profil_beneficiaire: true },
      });

      if (!profil) {
        throw new BadRequestException(
          'Le profil bénéficiaire ne correspond pas à cette entreprise.',
        );
      }
    }

    if (dto.validateur === 'autre' && !dto.manager_id_client_entreprise) {
      throw new BadRequestException(
        'Le manager est obligatoire quand validateur = autre.',
      );
    }

    if (dto.validateur === 'autre') {
      const manager = await this.prisma.clients_entreprises.findFirst({
        where: {
          id_client_entreprise: dto.manager_id_client_entreprise,
          id_entreprise,
          actif: true,
          role_entreprise: 'manager',
        },
        select: {
          id_client_entreprise: true,
        },
      });

      if (!manager) {
        throw new BadRequestException(
          'Le valideur sélectionné doit être un manager actif de la même entreprise.',
        );
      }
    }

    const existingClient = await this.prisma.clients.findUnique({
      where: { mail: email },
      select: {
        id_client: true,
        mail: true,
      },
    });

    let clientId: string;

    if (!existingClient) {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const createdClient = await this.prisma.clients.create({
        data: {
          id_client: await this.generateNextClientId(),
          mail: email,
          password: hashedPassword,
          nom: dto.nom.trim(),
          prenom: dto.prenom.trim(),
          date_naissance: dto.date_naissance
            ? new Date(dto.date_naissance)
            : null,
          pays: dto.pays ?? null,
          prefixe_tel: dto.prefixe_tel ?? null,
          num_tel: dto.num_tel ?? null,
          statut_client: 'Actif',
          type_client: 'Entreprise',
          language_favori: dto.language_favori ?? 'FR',
          date_creation: now,
          date_dern_maj: now,
          banned: false,
        },
        select: {
          id_client: true,
        },
      });

      clientId = createdClient.id_client;
    } else {
      clientId = existingClient.id_client;

      const existingMembership =
        await this.prisma.clients_entreprises.findFirst({
          where: {
            id_client: clientId,
            id_entreprise,
          },
          select: {
            id_client_entreprise: true,
          },
        });

      if (existingMembership) {
        throw new ConflictException(
          'Ce client est déjà rattaché à cette entreprise.',
        );
      }
    }

    const newMembershipId = await this.generateNextClientEntrepriseId();

    const membership = await this.prisma.clients_entreprises.create({
      data: {
        id_client_entreprise: newMembershipId,
        id_client: clientId,
        id_entreprise,
        id_centre_cout: dto.id_centre_cout ?? null,
        id_profil_beneficiaire: dto.id_profil_beneficiaire ?? null,
        manager_id_client_entreprise:
          dto.validateur === 'self'
            ? newMembershipId
            : dto.manager_id_client_entreprise!,
        role_entreprise: dto.role_entreprise,
        matricule: dto.matricule ?? null,
        actif: true,
        date_creation: now,
        date_dern_maj: now,
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
        clients: {
          select: {
            id_client: true,
            mail: true,
            nom: true,
            prenom: true,
            type_client: true,
          },
        },
      },
    });

    return {
      message: 'Collaborateur entreprise créé avec succès.',
      entreprise,
      collaborateur: membership,
    };
  }

  async findCollaborateurs(id_entreprise: string, user: any) {
    if (!user?.id_client) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const membership = await this.prisma.clients_entreprises.findFirst({
      where: {
        id_client: user.id_client,
        id_entreprise,
        actif: true,
      },
      select: {
        id_client_entreprise: true,
      },
    });

    if (!membership) {
      throw new BadRequestException(
        'Vous n’êtes pas autorisé à consulter les collaborateurs de cette entreprise.',
      );
    }

    return this.prisma.clients_entreprises.findMany({
      where: {
        id_entreprise,
        actif: true,
      },
      orderBy: [
        { role_entreprise: 'asc' },
        { date_creation: 'asc' },
      ],
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

  private async generateNextEntrepriseId(): Promise<string> {
    const last = await this.prisma.entreprises.findFirst({
      orderBy: { id_entreprise: 'desc' },
      select: { id_entreprise: true },
    });

    const nextNumber = last?.id_entreprise
      ? Number(last.id_entreprise.replace('ENT', '')) + 1
      : 1;

    return `ENT${String(nextNumber).padStart(8, '0')}`;
  }

  private async generateNextClientId(): Promise<string> {
    const last = await this.prisma.clients.findFirst({
      orderBy: { id_client: 'desc' },
      select: { id_client: true },
    });

    const nextNumber = last?.id_client
      ? Number(last.id_client.replace('CLI', '')) + 1
      : 1;

    return `CLI${String(nextNumber).padStart(8, '0')}`;
  }

  private async generateNextClientEntrepriseId(): Promise<string> {
    const last = await this.prisma.clients_entreprises.findFirst({
      orderBy: { id_client_entreprise: 'desc' },
      select: { id_client_entreprise: true },
    });

    const nextNumber = last?.id_client_entreprise
      ? Number(last.id_client_entreprise.replace('CLE', '')) + 1
      : 1;

    return `CLE${String(nextNumber).padStart(8, '0')}`;
  }

  private async generateNextCentreCoutId(): Promise<string> {
    const last = await this.prisma.centres_cout.findFirst({
      orderBy: { id_centre_cout: 'desc' },
      select: { id_centre_cout: true },
    });

    const nextNumber = last?.id_centre_cout
      ? Number(last.id_centre_cout.replace('CCO', '')) + 1
      : 1;

    return `CCO${String(nextNumber).padStart(8, '0')}`;
  }

  private async generateNextProfilBeneficiaireId(): Promise<string> {
    const last = await this.prisma.profils_beneficiaires.findFirst({
      orderBy: { id_profil_beneficiaire: 'desc' },
      select: { id_profil_beneficiaire: true },
    });

    const nextNumber = last?.id_profil_beneficiaire
      ? Number(last.id_profil_beneficiaire.replace('PRB', '')) + 1
      : 1;

    return `PRB${String(nextNumber).padStart(8, '0')}`;
  }

  async findOne(id_entreprise: string, user: any) {
    await this.assertCanAccessEntreprise(id_entreprise, user);

    const entreprise = await this.prisma.entreprises.findUnique({
      where: { id_entreprise },
      select: {
        id_entreprise: true,
        raison_sociale: true,
        slug: true,
        email_contact: true,
        tel_contact: true,
        statut: true,
        mode_validation_defaut: true,
        devise: true,
        date_creation: true,
        date_dern_maj: true,
      },
    });

    if (!entreprise) {
      throw new NotFoundException('Entreprise introuvable.');
    }

    return entreprise;
  }

  async findCentresCout(id_entreprise: string, user: any) {
    await this.assertCanAccessEntreprise(id_entreprise, user);

    return this.prisma.centres_cout.findMany({
      where: {
        id_entreprise,
      },
      orderBy: {
        libelle: 'asc',
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
  }

  async findProfilsBeneficiaires(id_entreprise: string, user: any) {
    await this.assertCanAccessEntreprise(id_entreprise, user);

    return this.prisma.profils_beneficiaires.findMany({
      where: {
        id_entreprise,
      },
      orderBy: {
        libelle: 'asc',
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
        liste_type_autorise: true,
        actif: true,
        date_creation: true,
        date_dern_maj: true,
      },
    });
  }

  private async assertCanAccessEntreprise(id_entreprise: string, user: any) {
    if (user?.role === 'admin') {
      return;
    }

    const membership = await this.prisma.clients_entreprises.findFirst({
      where: {
        id_client: user.id_client,
        id_entreprise,
        actif: true,
      },
      select: {
        id_client_entreprise: true,
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'Vous n’avez pas accès à cette entreprise.',
      );
    }
  }
}