import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PolicyEngineService } from '../b2b-core/policy-engine.service';
import { QuotaEngineService } from '../b2b-core/quota-engine.service';
import { ValidationEngineService } from '../b2b-core/validation-engine.service';
import { B2bQuoteDto } from './dto/b2b-quote.dto';
import { CreateB2bReservationDto } from './dto/create-b2b-reservation.dto';
import { B2bReservationsQueryDto } from './dto/b2b-reservations-query.dto';

@Injectable()
export class B2bReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyEngine: PolicyEngineService,
    private readonly quotaEngine: QuotaEngineService,
    private readonly validationEngine: ValidationEngineService,
  ) {}

  async quote(dto: B2bQuoteDto, user: any) {
    await this.assertUserOwnsMembership(
      dto.id_client_entreprise_demandeur,
      user,
    );

    const policy = await this.policyEngine.evaluate(dto);

    console.log('B2B lieux:', {
      type_depart: dto.type_lieu_depart,
      type_retour: dto.type_lieu_retour,
    });

    return {
      allowed: policy.allowed,
      requires_validation: policy.requires_validation,
      errors: policy.errors,
      warnings: policy.warnings,
      prix_estime: policy.context.cout_estime,
      quota_consomme: {
        jours: policy.context.nb_jours,
        budget: policy.context.cout_estime,
      },
      quota_status: policy.context.quota.summary,
    };
  }

  async create(dto: CreateB2bReservationDto, user: any) {
    await this.assertUserOwnsMembership(
      dto.id_client_entreprise_demandeur,
      user,
    );

    const policy = await this.policyEngine.evaluate(dto);

    if (!policy.allowed) {
      throw new BadRequestException({
        message: 'La réservation entreprise n’est pas autorisée.',
        errors: policy.errors,
        warnings: policy.warnings,
      });
    }

    const now = new Date();

    // =====================================================
    // NORMALISATION DES LIEUX (AGENCE / LOCALISATION)
    // Règle : si le retour n’est pas renseigné, il reprend le départ
    // =====================================================

    const typeDepart = dto.type_lieu_depart ?? 'agence';

    const typeRetour =
      dto.type_lieu_retour ??
      (typeDepart === 'localisation' ? 'localisation' : 'agence');

    // ---- DEPART ----
    const id_agence_depart = dto.id_agence_depart;
    const adresse_depart = dto.adresse_depart ?? null;
    const latitude_depart = dto.latitude_depart ?? null;
    const longitude_depart = dto.longitude_depart ?? null;

    if (typeDepart === 'localisation') {
      if (
        !adresse_depart ||
        latitude_depart == null ||
        longitude_depart == null
      ) {
        throw new BadRequestException(
          'Pour un départ en localisation, adresse + latitude + longitude sont obligatoires.',
        );
      }
    }

    // ---- RETOUR ----
    const id_agence_retour =
      dto.id_agence_retour ??
      (typeRetour === 'agence' ? dto.id_agence_depart : null);

    const adresse_retour =
      dto.adresse_retour ??
      (typeRetour === 'localisation' ? dto.adresse_depart ?? null : null);

    const latitude_retour =
      dto.latitude_retour ??
      (typeRetour === 'localisation' ? dto.latitude_depart ?? null : null);

    const longitude_retour =
      dto.longitude_retour ??
      (typeRetour === 'localisation' ? dto.longitude_depart ?? null : null);

    if (typeRetour === 'localisation') {
      if (
        !adresse_retour ||
        latitude_retour == null ||
        longitude_retour == null
      ) {
        throw new BadRequestException(
          'Pour un retour en localisation, adresse + latitude + longitude sont obligatoires.',
        );
      }
    }

    const retour_different =
      dto.retour_different ??
      !(
        typeDepart === typeRetour &&
        (typeDepart === 'agence'
          ? dto.id_agence_depart === id_agence_retour
          : (dto.adresse_depart ?? null) === adresse_retour &&
            (dto.latitude_depart ?? null) === latitude_retour &&
            (dto.longitude_depart ?? null) === longitude_retour)
      );

    const reservation = await this.prisma.reservations_entreprises.create({
      data: {
        id_reservation_entreprise:
          await this.generateNextReservationEntrepriseId(),
        id_entreprise: policy.context.entreprise.id_entreprise,
        id_client_entreprise_demandeur: dto.id_client_entreprise_demandeur,
        id_client_entreprise_beneficiaire:
          dto.id_client_entreprise_beneficiaire ??
          dto.id_client_entreprise_demandeur,
        id_centre_cout:
          dto.id_centre_cout ??
          policy.context.centre_cout?.id_centre_cout ??
          null,
        id_profil_beneficiaire:
          policy.context.profil_beneficiaire?.id_profil_beneficiaire ?? null,
        id_vehicule: dto.id_vehicule,

        id_agence_depart,
        id_agence_retour,
        retour_different,

        type_lieu_depart: typeDepart,
        adresse_depart,
        latitude_depart,
        longitude_depart,

        type_lieu_retour: typeRetour,
        adresse_retour,
        latitude_retour,
        longitude_retour,

        date_dep: new Date(dto.date_dep),
        date_ret: new Date(dto.date_ret),
        heure_dep: this.toTimeDate(dto.heure_dep),
        heure_ret: this.toTimeDate(dto.heure_ret),

        avec_chauffeur: dto.avec_chauffeur ?? false,
        type_trajet: dto.type_trajet ?? null,
        lieu_prise_en_charge: dto.lieu_prise_en_charge ?? null,
        lieu_destination: dto.lieu_destination ?? null,
        nb_passagers: dto.nb_passagers ?? null,
        instructions_specifiques: dto.instructions_specifiques ?? null,
        reserve_pour_tiers: dto.reserve_pour_tiers ?? false,

        id_tarification: dto.id_tarification ?? null,
        id_assurance: dto.id_assurance ?? null,

        cout_estime: policy.context.cout_estime,
        cout_final: policy.context.cout_estime,
        quota_jours_consomme: policy.context.nb_jours,
        quota_budget_consomme: policy.context.cout_estime,

        type_validation: policy.requires_validation ? 'manuelle' : 'automatique',
        statut_validation: policy.requires_validation
          ? 'en_attente'
          : 'validee',
        statut_reservation: policy.requires_validation
          ? 'en_attente_validation'
          : 'validee',

        date_creation: now,
        date_dern_maj: now,
      },
      include: {
        entreprises: true,
        profils_beneficiaires: true,
        centres_cout: true,
        vehicules: true,
      },
    });

    let demande_validation: any = null;
    let validation_mode: string | null = null;

    if (policy.requires_validation) {
      const validationResult =
        await this.validationEngine.createValidationRequest({
          id_reservation_entreprise: reservation.id_reservation_entreprise,
          id_entreprise: reservation.id_entreprise,
          id_client_entreprise_demandeur:
            reservation.id_client_entreprise_demandeur,
          motif:
            policy.warnings.join(' | ') ||
            'Validation requise par policy engine',
        });

      demande_validation = validationResult.demande;
      validation_mode = validationResult.mode;

      if (validationResult.mode === 'AUTO_VALIDATED') {
        await this.quotaEngine.consumeQuota({
          id_client_entreprise:
            reservation.id_client_entreprise_beneficiaire,
          nb_jours: reservation.quota_jours_consomme ?? 0,
          cout: Number(reservation.quota_budget_consomme ?? 0),
          dateRef: reservation.date_dep,
        });

        reservation.type_validation = 'automatique';
        reservation.statut_validation = 'validee';
        reservation.statut_reservation = 'validee';
      }
    } else {
      validation_mode = 'NO_VALIDATION_REQUIRED';

      await this.quotaEngine.consumeQuota({
        id_client_entreprise:
          reservation.id_client_entreprise_beneficiaire,
        nb_jours: reservation.quota_jours_consomme ?? 0,
        cout: Number(reservation.quota_budget_consomme ?? 0),
        dateRef: reservation.date_dep,
      });
    }

    return {
      message: 'Réservation entreprise créée avec succès.',
      reservation,
      demande_validation,
      validation_mode,
      policy: {
        allowed: policy.allowed,
        requires_validation: policy.requires_validation,
        errors: policy.errors,
        warnings: policy.warnings,
      },
    };
  }

  async findMine(query: B2bReservationsQueryDto, user: any) {
    const memberships = await this.prisma.clients_entreprises.findMany({
      where: {
        id_client: user.id_client,
        actif: true,
      },
      select: {
        id_client_entreprise: true,
        id_entreprise: true,
        role_entreprise: true,
      },
    });

    const ids = memberships.map((m) => m.id_client_entreprise);

    if (ids.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          memberships_count: 0,
        },
      };
    }

    
    const reservations = await this.prisma.reservations_entreprises.findMany({
      where: {
        OR: [
          { id_client_entreprise_demandeur: { in: ids } },
          { id_client_entreprise_beneficiaire: { in: ids } },
        ],
        statut_reservation: query.statut_reservation ?? undefined,
        statut_validation: query.statut_validation ?? undefined,
        id_entreprise: query.id_entreprise ?? undefined,
      },
      orderBy: {
        date_creation: query.sort_date_creation ?? 'desc',
      },
      include: {
        vehicules: true,
        entreprises: true,
        centres_cout: true,
        profils_beneficiaires: true,
        demandes_validation: {
          orderBy: {
            date_creation: 'desc',
          },
        },
      },
    });

    const data = reservations.map((reservation) => ({
      ...reservation,
      is_demandeur: ids.includes(
        reservation.id_client_entreprise_demandeur,
      ),
      is_beneficiaire:
        !!reservation.id_client_entreprise_beneficiaire &&
        ids.includes(reservation.id_client_entreprise_beneficiaire),
      has_pending_validation: reservation.demandes_validation.some(
        (d) => d.statut === 'en_attente',
      ),
      validation_count: reservation.demandes_validation.length,
      latest_validation_status:
        reservation.demandes_validation[0]?.statut ?? null,
    }));

    return {
      data,
      meta: {
        total: data.length,
        memberships_count: memberships.length,
      },
    };
  }

  async findAdmin(query: B2bReservationsQueryDto, user: any) {
    if (!this.isAdmin(user)) {
      throw new BadRequestException('Accès admin requis.');
    }

    const reservations = await this.prisma.reservations_entreprises.findMany({
      where: {
        statut_reservation: query.statut_reservation ?? undefined,
        statut_validation: query.statut_validation ?? undefined,
        id_entreprise: query.id_entreprise ?? undefined,
      },
      orderBy: {
        date_creation: query.sort_date_creation ?? 'desc',
      },
      include: {
        entreprises: true,
        vehicules: true,
        centres_cout: true,
        profils_beneficiaires: true,
        clients_entreprises_reservations_entreprises_id_client_entreprise_demandeurToclients_entreprises: {
          include: {
            clients: true,
          },
        },
        clients_entreprises_reservations_entreprises_id_client_entreprise_beneficiaireToclients_entreprises: {
          include: {
            clients: true,
          },
        },
      },
    });

    return {
      data: reservations,
      meta: {
        total: reservations.length,
      },
    };
  }

  async findValidationsForMe(user: any) {
    const memberships = await this.prisma.clients_entreprises.findMany({
      where: {
        id_client: user.id_client,
        actif: true,
      },
      select: {
        id_client_entreprise: true,
        id_entreprise: true,
        role_entreprise: true,
      },
    });

    const ids = memberships.map((m) => m.id_client_entreprise);

    if (ids.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          memberships_count: 0,
        },
      };
    }

    const validations = await this.prisma.demandes_validation.findMany({
      where: {
        id_client_entreprise_valideur: { in: ids },
        statut: 'en_attente',
      },
      orderBy: {
        date_creation: 'desc',
      },
      include: {
        reservations_entreprises: {
          include: {
            vehicules: true,
            entreprises: true,
            centres_cout: true,
            profils_beneficiaires: true,
          },
        },
        clients_entreprises_demandes_validation_id_client_entreprise_demandeurToclients_entreprises:
          {
            include: {
              clients: true,
            },
          },
        clients_entreprises_demandes_validation_id_client_entreprise_valideurToclients_entreprises:
          {
            include: {
              clients: true,
            },
          },
      },
    });

    const data = validations.map((validation) => ({
      ...validation,
      has_assigned_validator:
        !!validation.id_client_entreprise_valideur,
      demandeur:
        validation.clients_entreprises_demandes_validation_id_client_entreprise_demandeurToclients_entreprises,
      valideur:
        validation.clients_entreprises_demandes_validation_id_client_entreprise_valideurToclients_entreprises,
    }));

    return {
      data,
      meta: {
        total: data.length,
        memberships_count: memberships.length,
      },
    };
  }

  async approveValidation(id: string, user: any, commentaire?: string) {
    return this.validationEngine.approve(id, user, commentaire);
  }

  async rejectValidation(id: string, user: any, commentaire?: string) {
    return this.validationEngine.reject(id, user, commentaire);
  }

  async startReservation(id: string, user: any) {
    if (!this.isAdmin(user)) {
      throw new BadRequestException('Accès admin requis.');
    }

    const reservation = await this.prisma.reservations_entreprises.findUnique({
      where: { id_reservation_entreprise: id },
    });

    if (!reservation) {
      throw new NotFoundException('Réservation entreprise introuvable.');
    }

    if (!['validee', 'confirmee'].includes(reservation.statut_reservation)) {
      throw new BadRequestException(
        'Seule une réservation validée peut être mise en cours.',
      );
    }

    const updated = await this.prisma.reservations_entreprises.update({
      where: { id_reservation_entreprise: id },
      data: {
        statut_reservation: 'confirmee',
        date_dern_maj: new Date(),
      },
    });

    return {
      message: 'Réservation entreprise passée en cours avec succès.',
      reservation: updated,
    };
  }

  async completeReservation(id: string, user: any) {
    if (!this.isAdmin(user)) {
      throw new BadRequestException('Accès admin requis.');
    }

    const reservation = await this.prisma.reservations_entreprises.findUnique({
      where: { id_reservation_entreprise: id },
    });

    if (!reservation) {
      throw new NotFoundException('Réservation entreprise introuvable.');
    }

    if (!['en_cours', 'confirmee', 'validee'].includes(reservation.statut_reservation)) {
      throw new BadRequestException(
        'Seule une réservation active peut être terminée.',
      );
    }

    const updated = await this.prisma.reservations_entreprises.update({
      where: { id_reservation_entreprise: id },
      data: {
        statut_reservation: 'terminee',
        date_dern_maj: new Date(),
      },
    });

    return {
      message: 'Réservation entreprise terminée avec succès.',
      reservation: updated,
    };
  }

    async cancelReservation(id: string, user: any) {
    if (!this.isAdmin(user)) {
      throw new BadRequestException('Accès admin requis.');
    }

    const reservation = await this.prisma.reservations_entreprises.findUnique({
      where: { id_reservation_entreprise: id },
    });

    if (!reservation) {
      throw new NotFoundException('Réservation entreprise introuvable.');
    }

    if (['terminee', 'annulee'].includes(reservation.statut_reservation)) {
      throw new BadRequestException(
        'Cette réservation entreprise ne peut plus être annulée.',
      );
    }

    const updated = await this.prisma.reservations_entreprises.update({
      where: { id_reservation_entreprise: id },
      data: {
        statut_reservation: 'annulee',
        date_dern_maj: new Date(),
      },
    });

    return {
      message: 'Réservation entreprise annulée avec succès.',
      reservation: updated,
    };
  }

  private async assertUserOwnsMembership(
    id_client_entreprise: string,
    user: any,
  ) {
    const membership = await this.prisma.clients_entreprises.findFirst({
      where: {
        id_client_entreprise,
        id_client: user.id_client,
        actif: true,
      },
      select: { id_client_entreprise: true },
    });

    if (!membership) {
      throw new BadRequestException(
        'Ce collaborateur entreprise ne vous appartient pas.',
      );
    }
  }

  private toTimeDate(time: string): Date {
    return new Date(
      `1970-01-01T${time.length === 5 ? `${time}:00` : time}Z`,
    );
  }

  private async generateNextReservationEntrepriseId(): Promise<string> {
    const last = await this.prisma.reservations_entreprises.findFirst({
      orderBy: { id_reservation_entreprise: 'desc' },
      select: { id_reservation_entreprise: true },
    });

    const nextNumber = last?.id_reservation_entreprise
      ? Number(last.id_reservation_entreprise.replace('REN', '')) + 1
      : 1;

    return `REN${String(nextNumber).padStart(8, '0')}`;
  }

  private isAdmin(user: any): boolean {
    if (!user) {
      return false;
    }

    const role = String(user.role ?? user.type ?? '').toLowerCase();

    return (
      !!user.id_admin ||
      ['admin', 'meta_admin'].includes(role) ||
      (typeof user.sub === 'string' && user.sub.startsWith('ADM'))
    );
  }
}