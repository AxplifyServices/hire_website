import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type QuotaCheckInput = {
  id_client_entreprise: string;
  nb_jours_demande: number;
  cout_estime: number;
  date_dep: string;
  date_ret: string;
  exclude_reservation_id?: string;
};

type EffectiveLimits = {
  jours_alloues: number | null;
  budget_alloue: number | null;
  reservations_max_simultanees: number | null;
};

@Injectable()
export class QuotaEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateMonthlyQuota(id_client_entreprise: string, dateRef?: Date) {
    const targetDate = dateRef ?? new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    let quota = await this.prisma.quotas_clients_entreprises.findFirst({
      where: {
        id_client_entreprise,
        periode_annee: year,
        periode_mois: month,
      },
    });

    if (quota) {
      return quota;
    }

    const membership = await this.prisma.clients_entreprises.findUnique({
      where: { id_client_entreprise },
      include: {
        profils_beneficiaires: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Collaborateur entreprise introuvable.');
    }

    quota = await this.prisma.quotas_clients_entreprises.create({
      data: {
        id_quota_client_entreprise: await this.generateNextQuotaId(),
        id_client_entreprise,
        periode_annee: year,
        periode_mois: month,

        // Snapshot mensuel initial depuis le profil bénéficiaire
        jours_alloues: membership.profils_beneficiaires?.nb_jours_mois ?? null,
        jours_utilises: 0,

        budget_alloue:
          membership.profils_beneficiaires?.budget_plafond_mensuel ?? null,
        budget_utilise: 0,

        reservations_max_simultanees:
          membership.profils_beneficiaires?.nb_reservations_simultanees ?? null,
        reservations_simultanees_utilisees: 0,

        nb_trajets_alloues: null,
        nb_trajets_utilises: 0,

        actif: true,
        date_creation: new Date(),
        date_dern_maj: new Date(),
      },
    });

    return quota;
  }

  private async getMembershipWithProfile(id_client_entreprise: string) {
    const membership = await this.prisma.clients_entreprises.findUnique({
      where: { id_client_entreprise },
      include: {
        profils_beneficiaires: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Collaborateur entreprise introuvable.');
    }

    return membership;
  }

  private getEffectiveLimits(_membership: any, quota: any): EffectiveLimits {
    return {
      jours_alloues:
        quota?.jours_alloues !== null && quota?.jours_alloues !== undefined
          ? Number(quota.jours_alloues)
          : null,

      budget_alloue:
        quota?.budget_alloue !== null && quota?.budget_alloue !== undefined
          ? Number(quota.budget_alloue)
          : null,

      reservations_max_simultanees:
        quota?.reservations_max_simultanees !== null &&
        quota?.reservations_max_simultanees !== undefined
          ? Number(quota.reservations_max_simultanees)
          : null,
    };
  }

  private async countOverlappingActiveReservations(params: {
    id_client_entreprise: string;
    date_dep: string;
    date_ret: string;
    exclude_reservation_id?: string;
  }): Promise<number> {
    const dep = new Date(params.date_dep);
    const ret = new Date(params.date_ret);

    return this.prisma.reservations_entreprises.count({
      where: {
        id_client_entreprise_beneficiaire: params.id_client_entreprise,
        statut_reservation: 'validee',

        ...(params.exclude_reservation_id
          ? {
              id_reservation_entreprise: {
                not: params.exclude_reservation_id,
              },
            }
          : {}),

        AND: [
          {
            date_dep: {
              lt: ret,
            },
          },
          {
            date_ret: {
              gt: dep,
            },
          },
        ],
      },
    });
  }

  async getQuotaStatus(params: {
    id_client_entreprise: string;
    dateRef?: Date;
    date_dep?: string;
    date_ret?: string;
    exclude_reservation_id?: string;
  }) {
    const quota = await this.getOrCreateMonthlyQuota(
      params.id_client_entreprise,
      params.dateRef,
    );

    const membership = await this.getMembershipWithProfile(
      params.id_client_entreprise,
    );

    const effectiveLimits = this.getEffectiveLimits(membership, quota);

    const jours_utilises = Number(quota.jours_utilises ?? 0);
    const budget_utilise = Number(quota.budget_utilise ?? 0);

    let reservations_simultanees_utilisees = 0;

    if (params.date_dep && params.date_ret) {
      reservations_simultanees_utilisees =
        await this.countOverlappingActiveReservations({
          id_client_entreprise: params.id_client_entreprise,
          date_dep: params.date_dep,
          date_ret: params.date_ret,
          exclude_reservation_id: params.exclude_reservation_id,
        });
    }

    return {
      quota,
      effective_limits: effectiveLimits,
      summary: {
        jours_alloues: effectiveLimits.jours_alloues,
        jours_utilises,
        jours_restants:
          effectiveLimits.jours_alloues === null
            ? null
            : Math.max(effectiveLimits.jours_alloues - jours_utilises, 0),

        budget_alloue: effectiveLimits.budget_alloue,
        budget_utilise,
        budget_restant:
          effectiveLimits.budget_alloue === null
            ? null
            : Math.max(effectiveLimits.budget_alloue - budget_utilise, 0),

        reservations_max_simultanees:
          effectiveLimits.reservations_max_simultanees,
        reservations_simultanees_utilisees,
        reservations_simultanees_restantes:
          effectiveLimits.reservations_max_simultanees === null
            ? null
            : Math.max(
                effectiveLimits.reservations_max_simultanees -
                  reservations_simultanees_utilisees,
                0,
              ),
      },
    };
  }

  async checkQuota(input: QuotaCheckInput) {
    const quotaState = await this.getQuotaStatus({
      id_client_entreprise: input.id_client_entreprise,
      dateRef: new Date(input.date_dep),
      date_dep: input.date_dep,
      date_ret: input.date_ret,
      exclude_reservation_id: input.exclude_reservation_id,
    });

    const { summary } = quotaState;

    const projected = {
      jours: summary.jours_utilises + Number(input.nb_jours_demande ?? 0),
      budget: summary.budget_utilise + Number(input.cout_estime ?? 0),
      simultanees: summary.reservations_simultanees_utilisees + 1,
    };

    const exceeded = {
      jours:
        summary.jours_alloues !== null
          ? projected.jours > summary.jours_alloues
          : false,

      budget:
        summary.budget_alloue !== null
          ? projected.budget > summary.budget_alloue
          : false,

      simultanees:
        summary.reservations_max_simultanees !== null
          ? projected.simultanees > summary.reservations_max_simultanees
          : false,
    };

    return {
      quota: quotaState.quota,
      effective_limits: quotaState.effective_limits,
      summary,
      projected,
      exceeded,
    };
  }

  async consumeQuota(params: {
    id_client_entreprise: string;
    nb_jours: number;
    cout: number;
    dateRef: Date;
  }) {
    const quota = await this.getOrCreateMonthlyQuota(
      params.id_client_entreprise,
      params.dateRef,
    );

    return this.prisma.quotas_clients_entreprises.update({
      where: {
        id_quota_client_entreprise: quota.id_quota_client_entreprise,
      },
      data: {
        jours_utilises:
          Number(quota.jours_utilises ?? 0) + Number(params.nb_jours ?? 0),
        budget_utilise:
          Number(quota.budget_utilise ?? 0) + Number(params.cout ?? 0),
        nb_trajets_utilises: Number(quota.nb_trajets_utilises ?? 0) + 1,
        date_dern_maj: new Date(),
      },
    });
  }

  private async generateNextQuotaId(): Promise<string> {
    const last = await this.prisma.quotas_clients_entreprises.findFirst({
      orderBy: { id_quota_client_entreprise: 'desc' },
      select: { id_quota_client_entreprise: true },
    });

    const nextNumber = last?.id_quota_client_entreprise
      ? Number(last.id_quota_client_entreprise.replace('QCE', '')) + 1
      : 1;

    return `QCE${String(nextNumber).padStart(8, '0')}`;
  }
}