import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { QuoteDto } from './dto/quote.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ReservationsQueryDto } from './dto/reservations-query.dto';
import { CodesPromoService } from '../codes-promo/codes-promo.service';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService,
      private readonly codesPromoService: CodesPromoService, // ✅ AJOUT
  ) {}

  async getPrefill(user: any) {
    if (!user) {
      return {
        is_authenticated: false,
        client: null,
        politique_age: null,
      };
    }

    const client = await this.prisma.clients.findUnique({
      where: { id_client: user.id_client },
      select: {
        id_client: true,
        mail: true,
        nom: true,
        prenom: true,
        date_naissance: true,
        pays: true,
        prefixe_tel: true,
        num_tel: true,
        statut_client: true,
        type_client: true,
        banned: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable.');
    }

    const politiqueAge = await this.resolvePolitiqueAgeFromBirthDate(
      client.date_naissance,
    );

    return {
      is_authenticated: true,
      client,
      politique_age: politiqueAge,
    };
  }

  async quote(dto: QuoteDto) {
    const quote = await this.computeQuote({
      id_vehicule: dto.id_vehicule,
      date_dep: dto.date_dep,
      date_ret: dto.date_ret,
      id_tarification: dto.id_tarification,
      id_politique_age: dto.id_politique_age,
      id_assurance: dto.id_assurance,
      liste_id_option: dto.liste_id_option ?? [],
    });

    if (dto.code_promo) {
      const promo = await this.codesPromoService.validatePromo(dto.code_promo);

      const discount = this.codesPromoService.computeDiscount(
        promo,
        quote.prix_final,
      );

      const prixFinalAvecPromo = Math.max(quote.prix_final - discount, 0);

      return {
        ...quote,
        prix_final: prixFinalAvecPromo,
        promo_applied: true,
        discount,
        code_promo: dto.code_promo,
      };
    }

    return quote;
  }

  async createCart(dto: CreateCartDto, user: any) {
    const reservation = await this.prisma.reservations.create({
      data: {
        id_reservation: this.generateReservationId(),
        status: 'PANIER_EN_COURS',
        payment_status: 'not_started',
        is_abandoned: false,
        source_reservation: user ? 'connected' : 'guest',
        session_panier: dto.session_panier ?? this.generateCartSession(),
        etape_panier: 'agence_dates',
        id_client: user?.id_client ?? null,

        id_lieu_dep: dto.id_lieu_dep ?? null,
        id_lieu_ret: dto.id_lieu_ret ?? null,

        date_dep: dto.date_dep ? this.toDateOnly(dto.date_dep) : null,
        date_ret: dto.date_ret ? this.toDateOnly(dto.date_ret) : null,
        heure_dep: dto.heure_dep ? this.toTimeDate(dto.heure_dep) : null,
        heure_ret: dto.heure_ret ? this.toTimeDate(dto.heure_ret) : null,

        nom_snapshot: dto.nom ?? null,
        prenom_snapshot: dto.prenom ?? null,
        mail_snapshot: dto.mail?.trim().toLowerCase() ?? null,
        prefixe_tel_snapshot: dto.prefixe_tel ?? null,
        num_tel_snapshot: dto.num_tel ?? null,

        code_promo: dto.code_promo ?? null,

        date_creation: new Date(),
        date_dern_maj: new Date(),
        date_derniere_activite: new Date(),
        devise: 'MAD',
        liste_id_option: [],
      },
    });

    return {
      message: 'Panier créé avec succès.',
      reservation,
    };
  }

  async updateCart(
    id: string,
    dto: UpdateCartDto,
    user: any,
    session_panier?: string,
  ) {
    const reservation = await this.prisma.reservations.findUnique({
      where: { id_reservation: id },
    });

    if (!reservation) {
      throw new NotFoundException('Panier introuvable.');
    }

    this.assertCanAccessReservation(reservation, user, true, session_panier);

    const updated = await this.prisma.reservations.update({
      where: { id_reservation: id },
      data: {
        id_lieu_dep: dto.id_lieu_dep ?? undefined,
        id_lieu_ret: dto.id_lieu_ret ?? undefined,
        id_vehicule: dto.id_vehicule ?? undefined,
        id_tarification: dto.id_tarification ?? undefined,
        id_assurance: dto.id_assurance ?? undefined,
        id_politic_age: dto.id_politique_age ?? undefined,

        date_dep: dto.date_dep ? this.toDateOnly(dto.date_dep) : undefined,
        date_ret: dto.date_ret ? this.toDateOnly(dto.date_ret) : undefined,
        heure_dep: dto.heure_dep ? this.toTimeDate(dto.heure_dep) : undefined,
        heure_ret: dto.heure_ret ? this.toTimeDate(dto.heure_ret) : undefined,

        nom_snapshot: dto.nom ?? undefined,
        prenom_snapshot: dto.prenom ?? undefined,
        mail_snapshot: dto.mail?.trim().toLowerCase() ?? undefined,
        prefixe_tel_snapshot: dto.prefixe_tel ?? undefined,
        num_tel_snapshot: dto.num_tel ?? undefined,

        code_promo: dto.code_promo ?? undefined,
        devise: dto.devise ?? undefined,
        liste_id_option: dto.liste_id_option ?? undefined,
        etape_panier:
          dto.etape_panier ?? this.computeEtapePanier(dto, reservation),
        date_derniere_activite: new Date(),
        date_dern_maj: new Date(),
        is_abandoned: false,
        date_abandon: null,
      },
    });

    return {
      message: 'Panier mis à jour avec succès.',
      reservation: updated,
    };
  }

  async finalizeCart(id: string, user: any, session_panier?: string) {
    const reservation = await this.prisma.reservations.findUnique({
      where: { id_reservation: id },
    });

    if (!reservation) {
      throw new NotFoundException('Panier introuvable.');
    }

    this.assertCanAccessReservation(reservation, user, true, session_panier);

    if (
      !reservation.id_vehicule ||
      !reservation.id_lieu_dep ||
      !reservation.id_lieu_ret ||
      !reservation.date_dep ||
      !reservation.date_ret ||
      !reservation.heure_dep ||
      !reservation.heure_ret ||
      !reservation.id_tarification ||
      !reservation.id_politic_age
    ) {
      throw new BadRequestException(
        'Le panier n’est pas complet pour être finalisé.',
      );
    }

    const start = this.combineDateAndTime(
      reservation.date_dep,
      this.normalizeTimeValue(reservation.heure_dep),
    );
    const end = this.combineDateAndTime(
      reservation.date_ret,
      this.normalizeTimeValue(reservation.heure_ret),
    );

    await this.assertVehiculeStillAvailableExcludingReservation(
      reservation.id_vehicule,
      start,
      end,
      reservation.id_reservation,
    );

    const quote = await this.computeQuote({
      id_vehicule: reservation.id_vehicule,
      date_dep: reservation.date_dep.toISOString().slice(0, 10),
      date_ret: reservation.date_ret.toISOString().slice(0, 10),
      id_tarification: reservation.id_tarification,
      id_politique_age: reservation.id_politic_age,
      id_assurance: reservation.id_assurance ?? undefined,
      liste_id_option: reservation.liste_id_option ?? [],
    });

    let finalQuote: any = { ...quote };

    if (reservation.code_promo) {
      const promo = await this.codesPromoService.validatePromo(
        reservation.code_promo,
      );

      const discount = this.codesPromoService.computeDiscount(
        promo,
        quote.prix_final,
      );

      finalQuote = {
        ...quote,
        prix_final: Math.max(quote.prix_final - discount, 0),
        promo_applied: true,
        discount,
        code_promo: reservation.code_promo,
      };
    }

    const updated = await this.prisma.reservations.update({
      where: { id_reservation: id },
      data: {
        status: 'EN_ATTENTE_PAIEMENT',
        payment_status: 'pending',
        etape_panier: 'paiement',
        nb_jour: finalQuote.nb_jour,
        prix_initial: finalQuote.prix_initial,
        prix_final: finalQuote.prix_final,
        date_derniere_activite: new Date(),
        date_dern_maj: new Date(),
        is_abandoned: false,
        date_abandon: null,
      },
    });

    return {
      message: 'Panier finalisé. En attente du paiement.',
      reservation: updated,
      quote: finalQuote,
    };
  }

  async abandonCart(id: string, user: any, session_panier?: string) {
    const reservation = await this.prisma.reservations.findUnique({
      where: { id_reservation: id },
    });

    if (!reservation) {
      throw new NotFoundException('Panier introuvable.');
    }

    this.assertCanAccessReservation(reservation, user, true, session_panier);

    const updated = await this.prisma.reservations.update({
      where: { id_reservation: id },
      data: {
        status: 'ABANDONNEE',
        is_abandoned: true,
        date_abandon: new Date(),
        date_derniere_activite: new Date(),
        date_dern_maj: new Date(),
      },
    });

    return {
      message: 'Panier marqué comme abandonné.',
      reservation: updated,
    };
  }

  async findAll(query: ReservationsQueryDto, user: any) {
    if (!this.isAdmin(user)) {
      throw new ForbiddenException('Accès admin requis.');
    }

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: any = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.etape_panier ? { etape_panier: query.etape_panier } : {}),
      ...(query.id_client ? { id_client: query.id_client } : {}),
      ...(query.id_vehicule ? { id_vehicule: query.id_vehicule } : {}),
      ...(query.id_lieu_dep ? { id_lieu_dep: query.id_lieu_dep } : {}),
      ...(query.is_abandoned !== undefined
        ? { is_abandoned: query.is_abandoned === 'true' }
        : {}),
      ...(query.mail
        ? {
            OR: [
              { mail_snapshot: { contains: query.mail, mode: 'insensitive' } },
              {
                clients: {
                  mail: { contains: query.mail, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.reservations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date_creation: 'desc' },
        include: {
          clients: true,
          vehicules: true,
          assurances: true,
          tarifications: true,
          politiques_age: true,
        },
      }),
      this.prisma.reservations.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      data,
    };
  }

  async findMine(query: ReservationsQueryDto, user: any) {
    if (!user?.id_client) {
      throw new ForbiddenException('Compte client requis.');
    }

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: any = {
      id_client: user.id_client,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.reservations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date_creation: 'desc' },
        include: {
          vehicules: true,
          assurances: true,
          tarifications: true,
          politiques_age: true,
        },
      }),
      this.prisma.reservations.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      data,
    };
  }

  async findOne(id: string, user: any, session_panier?: string) {
    const reservation = await this.prisma.reservations.findUnique({
      where: { id_reservation: id },
      include: {
        clients: true,
        vehicules: true,
        assurances: true,
        tarifications: true,
        politiques_age: true,
        agences_reservations_id_lieu_depToagences: true,
        agences_reservations_id_lieu_retToagences: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Réservation introuvable.');
    }

    this.assertCanAccessReservation(reservation, user, true, session_panier);

    return reservation;
  }

  async create(dto: CreateReservationDto, user: any) {
    const start = this.combineDateAndTime(dto.date_dep, dto.heure_dep);
    const end = this.combineDateAndTime(dto.date_ret, dto.heure_ret);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Dates/heures invalides.');
    }

    if (end <= start) {
      throw new BadRequestException(
        'La date et heure de retour doivent être après la date et heure de départ.',
      );
    }

    const lieuDepart = await this.prisma.agences.findUnique({
      where: { id_agence: dto.id_lieu_dep },
    });

    if (!lieuDepart) {
      throw new NotFoundException('Agence de départ introuvable.');
    }

    const lieuRetour = await this.prisma.agences.findUnique({
      where: { id_agence: dto.id_lieu_ret },
    });

    if (!lieuRetour) {
      throw new NotFoundException('Agence de retour introuvable.');
    }

    const vehicule = await this.prisma.vehicules.findUnique({
      where: { id_vehicule: dto.id_vehicule },
    });

    if (!vehicule) {
      throw new NotFoundException('Véhicule introuvable.');
    }

    const resolvedClient = await this.resolveClient(dto, user);

    const finalPolitiqueAge = await this.resolvePolitiqueAgeForReservation(
      dto.id_politique_age,
      resolvedClient.date_naissance,
    );

    const quote = await this.computeQuote({
      id_vehicule: dto.id_vehicule,
      date_dep: dto.date_dep,
      date_ret: dto.date_ret,
      id_tarification: dto.id_tarification,
      id_politique_age: finalPolitiqueAge.id_politic_age,
      id_assurance: dto.id_assurance,
      liste_id_option: dto.liste_id_option ?? [],
    });

    let finalQuote: any = { ...quote };

    if (dto.code_promo) {
      const promo = await this.codesPromoService.validatePromo(dto.code_promo);

      const discount = this.codesPromoService.computeDiscount(
        promo,
        quote.prix_final,
      );

      finalQuote = {
        ...quote,
        prix_final: Math.max(quote.prix_final - discount, 0),
        promo_applied: true,
        discount,
        code_promo: dto.code_promo,
      };
    }

    await this.assertVehiculeStillAvailable(dto.id_vehicule, start, end);

    const reservation = await this.prisma.reservations.create({
      data: {
        id_reservation: this.generateReservationId(),
        date_dep: this.toDateOnly(dto.date_dep),
        date_ret: this.toDateOnly(dto.date_ret),
        heure_dep: this.toTimeDate(dto.heure_dep),
        heure_ret: this.toTimeDate(dto.heure_ret),
        id_lieu_dep: dto.id_lieu_dep,
        id_lieu_ret: dto.id_lieu_ret,
        status: 'VALIDEE',
        id_client: resolvedClient.id_client,
        id_vehicule: dto.id_vehicule,
        type_conducteur: finalPolitiqueAge.nom,
        code_promo: dto.code_promo ?? null,
        nb_jour: finalQuote.nb_jour,
        devise: dto.devise ?? 'MAD',
        prix_initial: finalQuote.prix_initial,
        prix_final: finalQuote.prix_final,
        date_creation: new Date(),
        date_dern_maj: new Date(),
        id_tarification: dto.id_tarification,
        id_assurance: dto.id_assurance ?? null,
        liste_id_option: dto.liste_id_option ?? [],
        id_politic_age: finalPolitiqueAge.id_politic_age,
      },
      select: {
        id_reservation: true,
        date_dep: true,
        date_ret: true,
        heure_dep: true,
        heure_ret: true,
        id_lieu_dep: true,
        id_lieu_ret: true,
        status: true,
        id_client: true,
        id_vehicule: true,
        type_conducteur: true,
        code_promo: true,
        nb_jour: true,
        devise: true,
        prix_initial: true,
        prix_final: true,
        id_tarification: true,
        id_assurance: true,
        liste_id_option: true,
        id_politic_age: true,
        date_creation: true,
      },
    });

    if (dto.code_promo) {
      await this.codesPromoService.validatePromo(dto.code_promo);
      await this.codesPromoService.incrementUsage(dto.code_promo);
    }

    return {
      message: 'Réservation créée avec succès.',
      reservation: {
        ...reservation,
        prix_initial:
          reservation.prix_initial !== null
            ? Number(reservation.prix_initial)
            : null,
        prix_final:
          reservation.prix_final !== null
            ? Number(reservation.prix_final)
            : null,
      },
      client_mode: user
        ? 'connected'
        : resolvedClient.wasCreated
          ? 'guest_created_prospect'
          : 'guest_existing_client',
      quote: finalQuote,
    };
  }

  private async resolveClient(dto: CreateReservationDto, user: any) {
    if (user?.id_client) {
      const client = await this.prisma.clients.findUnique({
        where: { id_client: user.id_client },
        select: {
          id_client: true,
          mail: true,
          nom: true,
          prenom: true,
          date_naissance: true,
          pays: true,
          prefixe_tel: true,
          num_tel: true,
        },
      });

      if (!client) {
        throw new NotFoundException('Client connecté introuvable.');
      }

      return {
        ...client,
        wasCreated: false,
      };
    }

    const normalizedEmail = dto.mail.trim().toLowerCase();

    const existingClient = await this.prisma.clients.findUnique({
      where: { mail: normalizedEmail },
      select: {
        id_client: true,
        mail: true,
        nom: true,
        prenom: true,
        date_naissance: true,
        pays: true,
        prefixe_tel: true,
        num_tel: true,
      },
    });

    if (existingClient) {
      return {
        ...existingClient,
        wasCreated: false,
      };
    }

    const createdClient = await this.prisma.clients.create({
      data: {
        id_client: this.generateClientId(),
        mail: normalizedEmail,
        password: null,
        nom: dto.nom,
        prenom: dto.prenom,
        date_naissance: dto.date_naissance
          ? new Date(dto.date_naissance)
          : null,
        pays: dto.pays ?? null,
        prefixe_tel: dto.prefixe_tel ?? null,
        num_tel: dto.num_tel ?? null,
        statut_client: 'Prospect',
        type_client: 'Particulier',
        language_favori: 'FR',
        date_creation: new Date(),
        date_dern_maj: new Date(),
        banned: false,
      },
      select: {
        id_client: true,
        mail: true,
        nom: true,
        prenom: true,
        date_naissance: true,
        pays: true,
        prefixe_tel: true,
        num_tel: true,
      },
    });

    return {
      ...createdClient,
      wasCreated: true,
    };
  }

  private async resolvePolitiqueAgeForReservation(
    requestedPolitiqueId: string,
    birthDate: Date | null,
  ) {
    const requestedPolitique = await this.prisma.politiques_age.findUnique({
      where: { id_politic_age: requestedPolitiqueId },
      select: {
        id_politic_age: true,
        nom: true,
        description: true,
        qualificatif: true,
        prix_jour: true,
      },
    });

    if (!requestedPolitique) {
      throw new NotFoundException("Politique d'âge introuvable.");
    }

    if (!birthDate) {
      return requestedPolitique;
    }

    const computedPolitique = await this.resolvePolitiqueAgeFromBirthDate(
      birthDate,
    );

    return computedPolitique ?? requestedPolitique;
  }

  private async resolvePolitiqueAgeFromBirthDate(birthDate: Date | null) {
    if (!birthDate) {
      return null;
    }

    const age = this.calculateAge(birthDate);

    let nomPolitique = 'Normal';

    if (age < 25) {
      nomPolitique = 'Junior';
    } else if (age > 65) {
      nomPolitique = 'Senior';
    }

    return this.prisma.politiques_age.findFirst({
      where: {
        nom: {
          equals: nomPolitique,
          mode: 'insensitive',
        },
      },
      select: {
        id_politic_age: true,
        nom: true,
        description: true,
        qualificatif: true,
        prix_jour: true,
      },
    });
  }

  private calculateAge(birthDate: Date) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const currentMonth = today.getMonth();
    const birthMonth = birthDate.getMonth();

    if (
      currentMonth < birthMonth ||
      (currentMonth === birthMonth && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  private async assertVehiculeStillAvailable(
    id_vehicule: string,
    requestedStart: Date,
    requestedEnd: Date,
  ) {
    const reservations = await this.prisma.reservations.findMany({
      where: {
        id_vehicule,
        status: {
          in: ['VALIDEE', 'EN_ATTENTE_PAIEMENT'],
        },
      },
      select: {
        id_reservation: true,
        date_dep: true,
        date_ret: true,
        heure_dep: true,
        heure_ret: true,
      },
    });

    for (const reservation of reservations) {
      const existingStart = this.combineDateAndTime(
        reservation.date_dep!,
        this.normalizeTimeValue(reservation.heure_dep),
      );

      const existingEnd = this.combineDateAndTime(
        reservation.date_ret!,
        this.normalizeTimeValue(reservation.heure_ret),
      );

      const overlaps =
        existingStart < requestedEnd && existingEnd > requestedStart;

      if (overlaps) {
        throw new ConflictException(
          'Ce véhicule n’est plus disponible sur la période sélectionnée.',
        );
      }
    }
  }

  private async computeQuote(input: {
    id_vehicule: string;
    date_dep: string;
    date_ret: string;
    id_tarification: string;
    id_politique_age: string;
    id_assurance?: string;
    liste_id_option?: string[];
  }) {
    const start = new Date(input.date_dep);
    const end = new Date(input.date_ret);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Dates invalides.');
    }

    if (end <= start) {
      throw new BadRequestException(
        'La date de retour doit être après la date de départ.',
      );
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const nb_jour = Math.ceil((end.getTime() - start.getTime()) / msPerDay);

    const vehicule = await this.prisma.vehicules.findUnique({
      where: { id_vehicule: input.id_vehicule },
    });

    if (!vehicule) {
      throw new NotFoundException('Véhicule introuvable.');
    }

    const tarification = await this.prisma.tarifications.findUnique({
      where: { id_tarification: input.id_tarification },
    });

    if (!tarification) {
      throw new NotFoundException('Tarification introuvable.');
    }

    const politiqueAge = await this.prisma.politiques_age.findUnique({
      where: { id_politic_age: input.id_politique_age },
    });

    if (!politiqueAge) {
      throw new NotFoundException("Politique d'âge introuvable.");
    }

    const assurance = input.id_assurance
      ? await this.prisma.assurances.findUnique({
          where: { id_assurance: input.id_assurance },
        })
      : null;

    if (input.id_assurance && !assurance) {
      throw new NotFoundException('Assurance introuvable.');
    }

    const options = input.liste_id_option?.length
      ? await this.prisma.options.findMany({
          where: {
            id_option: {
              in: input.liste_id_option,
            },
          },
        })
      : [];

    if (
      input.liste_id_option?.length &&
      options.length !== input.liste_id_option.length
    ) {
      throw new NotFoundException('Une ou plusieurs options sont introuvables.');
    }

    const discountRate = Number(tarification.discount_rate ?? 0);
    const prixVehiculeJour = Number(vehicule.prix_jour ?? 0);
    const prixAssuranceJour = Number(assurance?.prix_jour ?? 0);
    const prixAgeJour = Number(politiqueAge.prix_jour ?? 0);
    const prixOptionsJour = options.reduce(
      (sum, option) => sum + Number(option.prix_jour ?? 0),
      0,
    );

    const prixVehiculeRemiseJour =
      prixVehiculeJour * (1 - discountRate / 100);

    const totalVehicule = prixVehiculeRemiseJour * nb_jour;
    const totalOptions = prixOptionsJour * nb_jour;
    const totalAssurance = prixAssuranceJour * nb_jour;
    const totalAge = prixAgeJour * nb_jour;

    const prix_initial = prixVehiculeJour * nb_jour;
    const prix_final =
      totalVehicule + totalOptions + totalAssurance + totalAge;

    return {
      nb_jour,
      discount_rate: discountRate,
      breakdown: {
        prixVehiculeJour,
        prixVehiculeRemiseJour,
        prixOptionsJour,
        prixAssuranceJour,
        prixAgeJour,
        totalVehicule,
        totalOptions,
        totalAssurance,
        totalAge,
      },
      prix_initial,
      prix_final,
    };
  }

  private combineDateAndTime(dateValue: Date | string, timeValue: string): Date {
    const date =
      dateValue instanceof Date
        ? dateValue.toISOString().slice(0, 10)
        : new Date(dateValue).toISOString().slice(0, 10);

    const time = timeValue.length === 5 ? `${timeValue}:00` : timeValue;

    return new Date(`${date}T${time}`);
  }

  private normalizeTimeValue(value: string | Date | null | undefined): string {
    if (!value) {
      return '10:00:00';
    }

    if (typeof value === 'string') {
      return value.length === 5 ? `${value}:00` : value;
    }

    return value.toTimeString().slice(0, 8);
  }

  private toDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00`);
  }

  private toTimeDate(value: string): Date {
    const normalized = value.length === 5 ? `${value}:00` : value;
    return new Date(`1970-01-01T${normalized}`);
  }

  private generateReservationId() {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    return `RES${random}`;
  }

  private generateClientId() {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    return `CLI${random}`;
  }

  private computeEtapePanier(dto: UpdateCartDto, current: any): string {
    if (dto.id_politique_age || dto.nom || dto.prenom || dto.mail) {
      return 'formulaire';
    }

    if (dto.id_assurance) {
      return 'assurance';
    }

    if (dto.liste_id_option) {
      return 'options';
    }

    if (dto.id_tarification) {
      return 'tarification';
    }

    if (dto.id_vehicule) {
      return 'vehicule';
    }

    return current.etape_panier ?? 'agence_dates';
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

  private assertCanAccessReservation(
    reservation: any,
    user: any,
    allowGuestWithSession: boolean,
    sessionPanier?: string,
  ) {
    if (this.isAdmin(user)) {
      return;
    }

    if (user?.id_client) {
      if (reservation.id_client !== user.id_client) {
        throw new ForbiddenException('Accès interdit à cette réservation.');
      }
      return;
    }

    if (!allowGuestWithSession) {
      throw new ForbiddenException('Accès interdit à cette réservation.');
    }

    if (
      !sessionPanier ||
      !reservation.session_panier ||
      reservation.session_panier !== sessionPanier
    ) {
      throw new ForbiddenException('Accès invité invalide pour ce panier.');
    }
  }

  private generateCartSession() {
    return `cart_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }

  private async assertVehiculeStillAvailableExcludingReservation(
    id_vehicule: string,
    requestedStart: Date,
    requestedEnd: Date,
    reservationIdToExclude: string,
  ) {
    const reservations = await this.prisma.reservations.findMany({
      where: {
        id_vehicule,
        status: {
          in: ['VALIDEE', 'EN_ATTENTE_PAIEMENT'],
        },
        id_reservation: {
          not: reservationIdToExclude,
        },
      },
      select: {
        id_reservation: true,
        date_dep: true,
        date_ret: true,
        heure_dep: true,
        heure_ret: true,
      },
    });

    for (const reservation of reservations) {
      const existingStart = this.combineDateAndTime(
        reservation.date_dep!,
        this.normalizeTimeValue(reservation.heure_dep),
      );

      const existingEnd = this.combineDateAndTime(
        reservation.date_ret!,
        this.normalizeTimeValue(reservation.heure_ret),
      );

      const overlaps =
        existingStart < requestedEnd && existingEnd > requestedStart;

      if (overlaps) {
        throw new ConflictException(
          'Ce véhicule n’est plus disponible sur la période sélectionnée.',
        );
      }
    }
  }
  
  async resumeCart(id: string, user: any, session_panier?: string) {
  const reservation = await this.prisma.reservations.findUnique({
    where: { id_reservation: id },
  });

  if (!reservation) {
    throw new NotFoundException('Panier introuvable.');
  }

  // 🔐 sécurité accès
  this.assertCanAccessReservation(reservation, user, true, session_panier);

  // 🔄 remettre actif
  const updated = await this.prisma.reservations.update({
    where: { id_reservation: id },
    data: {
      is_abandoned: false,
      date_abandon: null,
      date_derniere_activite: new Date(),
      date_dern_maj: new Date(),
      status:
        reservation.status === 'ABANDONNEE'
          ? 'PANIER_EN_COURS'
          : reservation.status,
    },
  });

  return {
    message: 'Panier repris avec succès.',
    reservation: updated,
    etape_panier: updated.etape_panier,
  };
  }
}