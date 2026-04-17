import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuotaEngineService } from './quota-engine.service';

type ReservationPolicyInput = {
  id_client_entreprise_demandeur: string;
  id_client_entreprise_beneficiaire?: string;
  id_centre_cout?: string;
  id_profil_beneficiaire?: string;
  id_vehicule: string;
  id_agence_depart: string;
  id_agence_retour?: string;
  date_dep: string;
  date_ret: string;
  heure_dep: string;
  heure_ret: string;
  avec_chauffeur?: boolean;
  type_trajet?: string;
  id_tarification?: string;
  id_assurance?: string;

  type_lieu_depart?: 'agence' | 'localisation';
  adresse_depart?: string;
  latitude_depart?: number;
  longitude_depart?: number;

  type_lieu_retour?: 'agence' | 'localisation';
  adresse_retour?: string;
  latitude_retour?: number;
  longitude_retour?: number;
};

@Injectable()
export class PolicyEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotaEngine: QuotaEngineService,
  ) {}

  async evaluate(input: ReservationPolicyInput) {
    const errors: string[] = [];
    const warnings: string[] = [];

    const typeDepart = input.type_lieu_depart ?? 'agence';

    const effectiveTypeRetour =
      input.type_lieu_retour ??
      (typeDepart === 'localisation' ? 'localisation' : 'agence');

    const effectiveIdAgenceRetour =
      input.id_agence_retour ??
      (effectiveTypeRetour === 'agence' ? input.id_agence_depart : undefined);

    const effectiveAdresseRetour =
      input.adresse_retour ??
      (effectiveTypeRetour === 'localisation'
        ? input.adresse_depart
        : undefined);

    const effectiveLatitudeRetour =
      input.latitude_retour ??
      (effectiveTypeRetour === 'localisation'
        ? input.latitude_depart
        : undefined);

    const effectiveLongitudeRetour =
      input.longitude_retour ??
      (effectiveTypeRetour === 'localisation'
        ? input.longitude_depart
        : undefined);

    const demandeur = await this.prisma.clients_entreprises.findUnique({
      where: {
        id_client_entreprise: input.id_client_entreprise_demandeur,
      },
      include: {
        entreprises: true,
        centres_cout: true,
        profils_beneficiaires: true,
      },
    });

    if (!demandeur || !demandeur.actif) {
      throw new NotFoundException(
        'Collaborateur demandeur introuvable ou inactif.',
      );
    }

    const beneficiaireId =
      input.id_client_entreprise_beneficiaire ??
      input.id_client_entreprise_demandeur;

    const beneficiaire = await this.prisma.clients_entreprises.findUnique({
      where: { id_client_entreprise: beneficiaireId },
      include: {
        entreprises: true,
        centres_cout: true,
        profils_beneficiaires: true,
      },
    });

    if (!beneficiaire || !beneficiaire.actif) {
      throw new NotFoundException(
        'Collaborateur bénéficiaire introuvable ou inactif.',
      );
    }

    if (demandeur.id_entreprise !== beneficiaire.id_entreprise) {
      errors.push('Le bénéficiaire doit appartenir à la même entreprise.');
    }

    const entreprise = demandeur.entreprises;

    const centreCout = input.id_centre_cout
      ? await this.prisma.centres_cout.findFirst({
          where: {
            id_centre_cout: input.id_centre_cout,
            id_entreprise: entreprise.id_entreprise,
            actif: true,
          },
        })
      : beneficiaire.centres_cout ?? null;

    if (input.id_centre_cout && !centreCout) {
      errors.push('Centre de coût introuvable ou inactif.');
    }

    const profil = beneficiaire.profils_beneficiaires ?? null;

    const vehicule = await this.prisma.vehicules.findFirst({
      where: {
        id_vehicule: input.id_vehicule,
        status_vehicule: 'Actif',
      },
    });

    if (!vehicule) {
      errors.push('Véhicule introuvable ou inactif.');
    }

    if (
      profil &&
      Array.isArray(profil.liste_type_autorise) &&
      profil.liste_type_autorise.length > 0
    ) {
      if (
        !vehicule?.type_vehicule ||
        !profil.liste_type_autorise.includes(vehicule.type_vehicule)
      ) {
        errors.push(
          'Le véhicule sélectionné n’est pas autorisé pour ce profil bénéficiaire.',
        );
      }
    }

    // =====================================================
    // VALIDATION DES LIEUX
    // =====================================================

    // ---- Départ ----
    if (typeDepart === 'agence') {
      if (!input.id_agence_depart) {
        errors.push('Une agence de départ est obligatoire.');
      }
    }

    if (typeDepart === 'localisation') {
      if (
        !input.adresse_depart ||
        input.latitude_depart == null ||
        input.longitude_depart == null
      ) {
        errors.push(
          'Pour un départ en localisation, adresse, latitude et longitude sont obligatoires.',
        );
      }
    }

    // ---- Retour ----
    if (effectiveTypeRetour === 'agence') {
      if (!effectiveIdAgenceRetour) {
        errors.push('Une agence de retour est obligatoire.');
      }
    }

    if (effectiveTypeRetour === 'localisation') {
      if (
        !effectiveAdresseRetour ||
        effectiveLatitudeRetour == null ||
        effectiveLongitudeRetour == null
      ) {
        errors.push(
          'Pour un retour en localisation, adresse, latitude et longitude sont obligatoires.',
        );
      }
    }

    if (typeDepart === 'localisation') {
      warnings.push('Départ hors agence demandé.');
    }

    if (effectiveTypeRetour === 'localisation') {
      warnings.push('Retour hors agence demandé.');
    }

    if (
      typeDepart === 'localisation' ||
      effectiveTypeRetour === 'localisation'
    ) {
      warnings.push(
        'La réservation contient au moins un lieu libre en dehors du réseau d’agences.',
      );
    }

 

    const nb_jours = this.computeNbDays(input.date_dep, input.date_ret);

    if (nb_jours <= 0) {
      errors.push('La durée de réservation doit être supérieure à 0.');
    }

    if (profil) {
      if (input.avec_chauffeur && !profil.avec_chauffeur_autorise) {
        errors.push(
          'Le profil bénéficiaire n’autorise pas les réservations avec chauffeur.',
        );
      }

      if (!input.avec_chauffeur && !profil.sans_chauffeur_autorise) {
        errors.push(
          'Le profil bénéficiaire n’autorise pas les réservations sans chauffeur.',
        );
      }
    }

    const cout_estime = await this.computeEstimatedCost({
      id_vehicule: input.id_vehicule,
      id_tarification: input.id_tarification,
      id_assurance: input.id_assurance,
      nb_jours,
    });

    const quotaCheck = await this.quotaEngine.checkQuota({
      id_client_entreprise: beneficiaire.id_client_entreprise,
      nb_jours_demande: nb_jours,
      cout_estime,
      date_dep: input.date_dep,
      date_ret: input.date_ret,
    });

    let requires_validation = false;

    if (profil?.validation_requise) {
      requires_validation = true;
      warnings.push('Le profil bénéficiaire impose une validation.');
    }

    if (entreprise.mode_validation_defaut === 'manuelle') {
      requires_validation = true;
      warnings.push('L’entreprise est en mode validation manuelle.');
    }

    if (quotaCheck.exceeded.jours) {
      errors.push('Le quota mensuel de jours est insuffisant pour cette réservation.');
    }

    if (quotaCheck.exceeded.budget) {
      errors.push('Le budget mensuel est insuffisant pour cette réservation.');
    }

    if (quotaCheck.exceeded.simultanees) {
      errors.push('Le nombre maximal de réservations simultanées est atteint.');
    }

    return {
      allowed: errors.length === 0,
      requires_validation,
      errors,
      warnings,
      context: {
        entreprise,
        demandeur,
        beneficiaire,
        centre_cout: centreCout,
        profil_beneficiaire: profil,
        vehicule,
        nb_jours,
        cout_estime,
        quota: quotaCheck,
        lieux: {
          type_depart: typeDepart,
          type_retour: effectiveTypeRetour,
          id_agence_depart: input.id_agence_depart ?? null,
          id_agence_retour: effectiveIdAgenceRetour ?? null,
          adresse_depart: input.adresse_depart ?? null,
          latitude_depart: input.latitude_depart ?? null,
          longitude_depart: input.longitude_depart ?? null,
          adresse_retour: effectiveAdresseRetour ?? null,
          latitude_retour: effectiveLatitudeRetour ?? null,
          longitude_retour: effectiveLongitudeRetour ?? null,
        },
      },
    };
  }

  private computeNbDays(dateDep: string, dateRet: string): number {
    const dep = new Date(dateDep);
    const ret = new Date(dateRet);

    const diffMs = ret.getTime() - dep.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  private async computeEstimatedCost(params: {
    id_vehicule: string;
    id_tarification?: string;
    id_assurance?: string;
    nb_jours: number;
  }): Promise<number> {
    const vehicule = await this.prisma.vehicules.findUnique({
      where: { id_vehicule: params.id_vehicule },
      select: { prix_jour: true },
    });

    if (!vehicule?.prix_jour) {
      return 0;
    }

    let prixJour = Number(vehicule.prix_jour);

    if (params.id_tarification) {
      const tarification = await this.prisma.tarifications.findUnique({
        where: { id_tarification: params.id_tarification },
        select: { discount_rate: true },
      });

      if (tarification?.discount_rate) {
        const discount = Number(tarification.discount_rate);
        prixJour = prixJour * (1 - discount / 100);
      }
    }

    let assurance = 0;

    if (params.id_assurance) {
      const row = await this.prisma.assurances.findUnique({
        where: { id_assurance: params.id_assurance },
        select: { prix_jour: true },
      });

      assurance = Number(row?.prix_jour ?? 0);
    }

    return Number(((prixJour + assurance) * params.nb_jours).toFixed(2));
  }
}