import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-me',
    });
  }

  async validate(payload: { sub: string; mail: string; role?: string }) {
    if (payload.role === 'admin') {
      const admin = await this.prisma.admins.findUnique({
        where: { id_admin: payload.sub },
        select: {
          id_admin: true,
          mail: true,
          nom: true,
          prenom: true,
          grade: true,
          date_creation: true,
        },
      });

      if (!admin) {
        throw new UnauthorizedException('Administrateur introuvable.');
      }

      return {
        ...admin,
        role: 'admin',
      };
    }

    const client = await this.prisma.clients.findUnique({
      where: { id_client: payload.sub },
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
        language_favori: true,
        date_creation: true,
        date_dern_maj: true,
        banned: true,
      },
    });

    if (!client) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    if (client.banned) {
      throw new UnauthorizedException(
        'Ce compte a été bloqué par un administrateur.',
      );
    }

    if (client.statut_client === 'Rupture relation') {
      throw new UnauthorizedException('Ce compte est désactivé.');
    }

    return {
      ...client,
      role: 'client',
    };
  }
}