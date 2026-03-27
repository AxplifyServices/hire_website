import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class CodesPromoService {
  constructor(private prisma: PrismaService) {}

  // 🔍 Récupérer un code promo
  async findByCode(code: string) {
    if (!code) return null;

    return this.prisma.codes_promo.findFirst({
      where: {
        code: code.trim(),
      },
    });
  }

  // ✅ Validation complète du code promo
  async validatePromo(code: string) {
    if (!code) return null;

    const promo = await this.findByCode(code);

    if (!promo) {
      throw new NotFoundException('Code promo invalide');
    }

    // 🔴 statut
    if (promo.status !== 'Valide') {
      throw new BadRequestException('Code promo inactif');
    }

    // 🔴 date de validité
    if (promo.date_fin_validite && new Date(promo.date_fin_validite) < new Date()) {
      throw new BadRequestException('Code promo expiré');
    }

    // 🔴 limite d’utilisation
    if (
      promo.nb_max_utilisation !== null &&
      promo.count_use >= promo.nb_max_utilisation
    ) {
      throw new BadRequestException('Code promo épuisé');
    }

    return promo;
  }

  // 💰 Calcul de la réduction
  computeDiscount(promo: any, montant: number): number {
    if (!promo) return 0;

    let discount = 0;

    if (promo.type_promo === 'pourcentage') {
      discount = (montant * promo.valeur_promo) / 100;
    }

    if (promo.type_promo === 'fixe') {
      discount = promo.valeur_promo;
    }

    // 🔒 éviter prix négatif
    if (discount > montant) {
      discount = montant;
    }

    return discount;
  }

  // 🔁 Incrémenter l’usage
  async incrementUsage(code: string) {
    if (!code) return;

    const promo = await this.findByCode(code);

    if (!promo) return;

    await this.prisma.codes_promo.update({
      where: { id_coupon: promo.id_coupon },
      data: {
        count_use: {
          increment: 1,
        },
      },
    });
  }
}