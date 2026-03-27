import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AbandonedCartsService {
  constructor(private readonly prisma: PrismaService) {}

  // ⏱️ Toutes les 10 minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async markAbandonedCarts() {
    const now = new Date();

    // ⚙️ règle métier : 30 minutes d’inactivité
    const thresholdMinutes = 30;

    const thresholdDate = new Date(
      now.getTime() - thresholdMinutes * 60 * 1000,
    );

    // 🔍 récupérer les paniers inactifs
    const carts = await this.prisma.reservations.findMany({
      where: {
        status: 'PANIER_EN_COURS',
        is_abandoned: false,
        date_derniere_activite: {
          lt: thresholdDate,
        },
      },
      select: {
        id_reservation: true,
      },
    });

    if (!carts.length) {
      return;
    }

    const ids = carts.map((c) => c.id_reservation);

    // 🔄 mise à jour en masse
    await this.prisma.reservations.updateMany({
      where: {
        id_reservation: {
          in: ids,
        },
      },
      data: {
        is_abandoned: true,
        status: 'ABANDONNEE',
        date_abandon: now,
        date_dern_maj: now,
      },
    });

    console.log(
      `[ABANDON] ${ids.length} paniers marqués comme abandonnés`,
    );
  }

    private readonly SECRET = 'super-secret-key'; // ⚠️ à mettre dans .env plus tard

    generateRecoveryLink(id_reservation: string, session_panier: string) {
    const expires = Date.now() + 1000 * 60 * 60 * 24; // 24h

    const payload = `${id_reservation}.${session_panier}.${expires}`;

    const signature = crypto
        .createHmac('sha256', this.SECRET)
        .update(payload)
        .digest('hex');

    const token = `${payload}.${signature}`;

    return {
        token,
        url: `/reservations/resume?token=${token}`,
    };
    }

    validateRecoveryToken(token: string) {
    if (!token) {
        throw new BadRequestException('Token manquant');
    }

    const parts = token.split('.');

    if (parts.length !== 4) {
        throw new BadRequestException('Token invalide');
    }

    const [id_reservation, session_panier, expires, signature] = parts;

    const payload = `${id_reservation}.${session_panier}.${expires}`;

    const expectedSignature = crypto
        .createHmac('sha256', this.SECRET)
        .update(payload)
        .digest('hex');

    if (expectedSignature !== signature) {
        throw new BadRequestException('Signature invalide');
    }

    if (Date.now() > Number(expires)) {
        throw new BadRequestException('Lien expiré');
    }

    return {
        id_reservation,
        session_panier,
    };
    }

    async generateRecoveryLinkForReservation(
    id_reservation: string,
    user: any,
    session_panier?: string,
    ) {
    const reservation = await this.prisma.reservations.findUnique({
        where: { id_reservation },
        select: {
        id_reservation: true,
        id_client: true,
        session_panier: true,
        status: true,
        is_abandoned: true,
        },
    });

    if (!reservation) {
        throw new BadRequestException('Panier introuvable');
    }

    // accès admin
    const role = String(user?.role ?? user?.type ?? '').toLowerCase();
    const isAdmin =
        !!user?.id_admin ||
        ['admin', 'meta_admin'].includes(role) ||
        (typeof user?.sub === 'string' && user.sub.startsWith('ADM'));

    if (isAdmin) {
        if (!reservation.session_panier) {
        throw new BadRequestException(
            'Aucune session panier associée à cette réservation',
        );
        }

        return this.generateRecoveryLink(
        reservation.id_reservation,
        reservation.session_panier,
        );
    }

    // accès client connecté
    if (user?.id_client) {
        if (reservation.id_client !== user.id_client) {
        throw new BadRequestException('Accès interdit à ce panier');
        }

        if (!reservation.session_panier) {
        throw new BadRequestException(
            'Aucune session panier associée à cette réservation',
        );
        }

        return this.generateRecoveryLink(
        reservation.id_reservation,
        reservation.session_panier,
        );
    }

    // accès invité
    if (
        !session_panier ||
        !reservation.session_panier ||
        reservation.session_panier !== session_panier
    ) {
        throw new BadRequestException('Accès invité invalide pour ce panier');
    }

    return this.generateRecoveryLink(
        reservation.id_reservation,
        reservation.session_panier,
    );
    }
}