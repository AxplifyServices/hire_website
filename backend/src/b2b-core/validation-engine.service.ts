import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuotaEngineService } from './quota-engine.service';

type ValidatorResolution =
  | {
      type: 'SELF';
      manager: null;
    }
  | {
      type: 'NONE';
      manager: null;
    }
  | {
      type: 'MANAGER';
      manager: any;
    };

@Injectable()
export class ValidationEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotaEngine: QuotaEngineService,
  ) {}

  async findValidator(
    id_client_entreprise_demandeur: string,
  ): Promise<ValidatorResolution> {
    const demandeur = await this.prisma.clients_entreprises.findUnique({
      where: { id_client_entreprise: id_client_entreprise_demandeur },
    });

    if (!demandeur) {
      throw new NotFoundException('Demandeur introuvable.');
    }

    if (!demandeur.manager_id_client_entreprise) {
      return {
        type: 'NONE',
        manager: null,
      };
    }

    if (
      demandeur.manager_id_client_entreprise ===
      demandeur.id_client_entreprise
    ) {
      return {
        type: 'SELF',
        manager: null,
      };
    }

    const manager = await this.prisma.clients_entreprises.findFirst({
      where: {
        id_client_entreprise: demandeur.manager_id_client_entreprise,
        id_entreprise: demandeur.id_entreprise,
        actif: true,
        role_entreprise: 'manager',
      },
      include: {
        clients: true,
      },
    });

    if (!manager) {
      return {
        type: 'NONE',
        manager: null,
      };
    }

    return {
      type: 'MANAGER',
      manager,
    };
  }

  async createValidationRequest(params: {
    id_reservation_entreprise: string;
    id_entreprise: string;
    id_client_entreprise_demandeur: string;
    motif?: string;
  }) {
    const validatorResult = await this.findValidator(
      params.id_client_entreprise_demandeur,
    );

    const now = new Date();

    // CAS 1 : self validation => validation automatique
    if (validatorResult.type === 'SELF') {
      await this.prisma.reservations_entreprises.update({
        where: {
          id_reservation_entreprise: params.id_reservation_entreprise,
        },
        data: {
          type_validation: 'automatique',
          statut_validation: 'validee',
          statut_reservation: 'validee',
          date_dern_maj: now,
        },
      });

      return {
        mode: 'AUTO_VALIDATED',
        demande: null,
        reservation_updated: true,
        message:
          'Validation automatique appliquée car le demandeur est son propre valideur.',
      };
    }

    // CAS 2 : aucun valideur exploitable
    if (validatorResult.type === 'NONE') {
      const demande = await this.prisma.demandes_validation.create({
        data: {
          id_demande_validation: await this.generateNextValidationId(),
          id_reservation_entreprise: params.id_reservation_entreprise,
          id_entreprise: params.id_entreprise,
          id_client_entreprise_demandeur:
            params.id_client_entreprise_demandeur,
          id_client_entreprise_valideur: null,
          niveau_validation: 1,
          statut: 'en_attente',
          motif: params.motif ?? null,
          date_demande: now,
          date_creation: now,
          date_dern_maj: now,
        },
      });

      return {
        mode: 'NO_VALIDATOR',
        demande,
        reservation_updated: false,
        message: 'Demande créée sans valideur assigné.',
      };
    }

    // CAS 3 : valideur trouvé => flow normal
    const demande = await this.prisma.demandes_validation.create({
      data: {
        id_demande_validation: await this.generateNextValidationId(),
        id_reservation_entreprise: params.id_reservation_entreprise,
        id_entreprise: params.id_entreprise,
        id_client_entreprise_demandeur: params.id_client_entreprise_demandeur,
        id_client_entreprise_valideur:
          validatorResult.manager.id_client_entreprise,
        niveau_validation: 1,
        statut: 'en_attente',
        motif: params.motif ?? null,
        date_demande: now,
        date_creation: now,
        date_dern_maj: now,
      },
      include: {
        clients_entreprises_demandes_validation_id_client_entreprise_valideurToclients_entreprises:
          {
            include: { clients: true },
          },
      },
    });

    return {
      mode: 'VALIDATION_REQUEST_CREATED',
      demande,
      reservation_updated: false,
      message: 'Demande de validation créée avec succès.',
    };
  }

  async approve(
    id_demande_validation: string,
    currentUser: any,
    commentaire?: string,
  ) {
    const validation = await this.prisma.demandes_validation.findUnique({
      where: { id_demande_validation },
    });

    if (!validation) {
      throw new NotFoundException('Demande de validation introuvable.');
    }

    if (validation.statut !== 'en_attente') {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    const validatorMembership = await this.prisma.clients_entreprises.findFirst({
      where: {
        id_client: currentUser.id_client,
        id_client_entreprise:
          validation.id_client_entreprise_valideur ?? undefined,
        actif: true,
      },
    });

    if (!validatorMembership) {
      throw new BadRequestException(
        'Vous n’êtes pas autorisé à valider cette demande.',
      );
    }

    const now = new Date();

    await this.prisma.demandes_validation.update({
      where: { id_demande_validation },
      data: {
        statut: 'validee',
        commentaire_decision: commentaire ?? null,
        date_decision: now,
        date_dern_maj: now,
      },
    });

    const reservation = await this.prisma.reservations_entreprises.update({
      where: {
        id_reservation_entreprise: validation.id_reservation_entreprise,
      },
      data: {
        statut_validation: 'validee',
        statut_reservation: 'validee',
        date_dern_maj: now,
      },
    });

    await this.quotaEngine.consumeQuota({
      id_client_entreprise:
        reservation.id_client_entreprise_beneficiaire,
      nb_jours: reservation.quota_jours_consomme ?? 0,
      cout: Number(reservation.quota_budget_consomme ?? 0),
      dateRef: reservation.date_dep,
    });

    return {
      message: 'Demande validée avec succès.',
    };
  }

  async reject(
    id_demande_validation: string,
    currentUser: any,
    commentaire?: string,
  ) {
    const validation = await this.prisma.demandes_validation.findUnique({
      where: { id_demande_validation },
    });

    if (!validation) {
      throw new NotFoundException('Demande de validation introuvable.');
    }

    if (validation.statut !== 'en_attente') {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    const validatorMembership = await this.prisma.clients_entreprises.findFirst({
      where: {
        id_client: currentUser.id_client,
        id_client_entreprise:
          validation.id_client_entreprise_valideur ?? undefined,
        actif: true,
      },
    });

    if (!validatorMembership) {
      throw new BadRequestException(
        'Vous n’êtes pas autorisé à refuser cette demande.',
      );
    }

    const now = new Date();

    await this.prisma.demandes_validation.update({
      where: { id_demande_validation },
      data: {
        statut: 'refusee',
        commentaire_decision: commentaire ?? null,
        date_decision: now,
        date_dern_maj: now,
      },
    });

    await this.prisma.reservations_entreprises.update({
      where: {
        id_reservation_entreprise: validation.id_reservation_entreprise,
      },
      data: {
        statut_validation: 'refusee',
        statut_reservation: 'refusee',
        date_dern_maj: now,
      },
    });

    return {
      message: 'Demande refusée avec succès.',
    };
  }

  private async generateNextValidationId(): Promise<string> {
    const last = await this.prisma.demandes_validation.findFirst({
      orderBy: { id_demande_validation: 'desc' },
      select: { id_demande_validation: true },
    });

    const nextNumber = last?.id_demande_validation
      ? Number(last.id_demande_validation.replace('DVL', '')) + 1
      : 1;

    return `DVL${String(nextNumber).padStart(8, '0')}`;
  }
}