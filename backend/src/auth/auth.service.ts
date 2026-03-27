import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AdminLoginDto } from './dto/admin-login.dto';


type DeleteActor = {
  deleted_by_type?: string | null;
  deleted_by_id?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.mail.trim().toLowerCase();

    const existingClient = await this.prisma.clients.findUnique({
      where: { mail: email },
    });

    if (existingClient) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const now = new Date();

    const client = await this.prisma.clients.create({
      data: {
        id_client: this.generateClientId(),
        mail: email,
        password: hashedPassword,
        nom: dto.nom,
        prenom: dto.prenom,
        date_naissance: dto.date_naissance
          ? new Date(dto.date_naissance)
          : null,
        pays: dto.pays ?? null,
        prefixe_tel: dto.prefixe_tel ?? null,
        num_tel: dto.num_tel ?? null,
        statut_client: 'Actif',
        type_client: dto.type_client ?? 'Particulier',
        language_favori: dto.language_favori ?? 'FR',
        date_creation: now,
        date_dern_maj: now,
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
        statut_client: true,
        type_client: true,
        language_favori: true,
        date_creation: true,
        date_dern_maj: true,
        banned: true,
      },
    });

    if (!client.id_client || !client.mail) {
      throw new UnauthorizedException(
        'Impossible de générer le token utilisateur.',
      );
    }

    const access_token = await this.signToken(client.id_client, client.mail);

    return {
      message: 'Compte créé avec succès.',
      access_token,
      client,
    };
  }

  async login(dto: LoginDto, req: any) {
    const email = dto.mail.trim().toLowerCase();

    const client = await this.prisma.clients.findUnique({
      where: { mail: email },
    });

    if (!client) {
      throw new UnauthorizedException('Email ou mot de passe invalide.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      client.password ?? '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe invalide.');
    }

    if (client.banned) {
      throw new UnauthorizedException(
        'Ce compte a été bloqué par un administrateur.',
      );
    }

    if (client.statut_client === 'Rupture relation') {
      throw new UnauthorizedException(
        'Ce compte est désactivé. Veuillez contacter le support.',
      );
    }

    if (!client.id_client || !client.mail) {
      throw new UnauthorizedException(
        'Impossible de générer le token utilisateur.',
      );
    }

    await this.logConnexion(client.id_client, req);

    const access_token = await this.signToken(client.id_client, client.mail);

    return {
      message: 'Connexion réussie.',
      access_token,
      client: {
        id_client: client.id_client,
        mail: client.mail,
        nom: client.nom,
        prenom: client.prenom,
        date_naissance: client.date_naissance,
        pays: client.pays,
        prefixe_tel: client.prefixe_tel,
        num_tel: client.num_tel,
        statut_client: client.statut_client,
        type_client: client.type_client,
        language_favori: client.language_favori,
        date_creation: client.date_creation,
        date_dern_maj: client.date_dern_maj,
        banned: client.banned,
      },
    };
  }

  async me(id_client: string) {
    return this.prisma.clients.findUnique({
      where: { id_client },
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
  }

  async deleteClientById(id_client: string, actor?: DeleteActor) {
    const client = await this.prisma.clients.findUnique({
      where: { id_client },
      select: {
        id_client: true,
        mail: true,
        statut_client: true,
        banned: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Compte client introuvable.');
    }

    const banned = actor?.deleted_by_type === 'admin';

    const updatedClient = await this.prisma.clients.update({
      where: { id_client },
      data: {
        statut_client: 'Rupture relation',
        banned,
        date_dern_maj: new Date(),
      },
      select: {
        id_client: true,
        mail: true,
        statut_client: true,
        banned: true,
        date_dern_maj: true,
      },
    });

    return {
      message: 'Compte client désactivé avec succès.',
      client: updatedClient,
      audit: {
        deleted_by_type: actor?.deleted_by_type ?? null,
        deleted_by_id: actor?.deleted_by_id ?? null,
      },
    };
  }
  
  async adminLogin(dto: AdminLoginDto) {
  const email = dto.mail.trim().toLowerCase();

  const admin = await this.prisma.admins.findUnique({
    where: { mail: email },
  });

  if (!admin) {
    throw new UnauthorizedException('Email ou mot de passe admin invalide.');
  }

  const isPasswordValid = await bcrypt.compare(
    dto.password,
    admin.password ?? '',
  );

  if (!isPasswordValid) {
    throw new UnauthorizedException('Email ou mot de passe admin invalide.');
  }

  if (!admin.id_admin || !admin.mail) {
    throw new UnauthorizedException(
      'Impossible de générer le token administrateur.',
    );
  }

  const access_token = await this.jwtService.signAsync({
    sub: admin.id_admin,
    mail: admin.mail,
    role: 'admin',
  });

  return {
    message: 'Connexion admin réussie.',
    access_token,
    admin: {
      id_admin: admin.id_admin,
      mail: admin.mail,
      nom: admin.nom,
      prenom: admin.prenom,
      grade: admin.grade,
      date_creation: admin.date_creation,
    },
  };
  }

  private async logConnexion(id_client: string, req: any) {
    const { ip, pays, ville } = this.extractConnectionMetadata(req);

    await this.prisma.logs_connexion.create({
      data: {
        id_log_connexion: this.generateLoginLogId(),
        id_client,
        date_connexion: new Date(),
        ip_connexion: ip,
        pays_connexion: pays,
        ville_connexion: ville,
      },
    });
  }

  private extractConnectionMetadata(req: any) {
    const forwardedFor = req?.headers?.['x-forwarded-for'];
    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req?.ip ?? req?.socket?.remoteAddress ?? null;

    const pays =
      req?.headers?.['cf-ipcountry'] ??
      req?.headers?.['x-vercel-ip-country'] ??
      null;

    const ville =
      req?.headers?.['x-vercel-ip-city'] ??
      req?.headers?.['x-city'] ??
      null;

    return { ip, pays, ville };
  }

  private async signToken(id_client: string, mail: string) {
    return this.jwtService.signAsync({
      sub: id_client,
      mail,
    });
  }

  private generateClientId() {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    return `CLI${random}`;
  }

  private generateLoginLogId() {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    return `LOG${random}`;
  }
}