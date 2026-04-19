import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ListClientsDto } from './dto/list-clients.dto';
import { CreateClientAdminDto } from './dto/create-client-admin.dto';
import { UpdateClientAdminDto } from './dto/update-client-admin.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: ListClientsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = dto.sort_by ?? 'date_creation';
    const sortOrder = dto.sort_order ?? 'desc';
    const search = dto.search?.trim();

    const effectiveTypeClient = dto.type_client?.trim() || 'Particulier';
    const where: Prisma.clientsWhereInput = {
      ...(search
        ? {
            OR: [
              { id_client: { contains: search, mode: 'insensitive' } },
              { mail: { contains: search, mode: 'insensitive' } },
              { nom: { contains: search, mode: 'insensitive' } },
              { prenom: { contains: search, mode: 'insensitive' } },
              { num_tel: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(dto.statut_client
        ? {
            statut_client: {
              equals: dto.statut_client,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(dto.type_client
        ? {
            type_client: {
              equals: dto.type_client,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(dto.language_favori
        ? {
            language_favori: {
              equals: effectiveTypeClient,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [total, clients] = await Promise.all([
      this.prisma.clients.count({ where }),
      this.prisma.clients.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
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
      }),
    ]);

    return {
      data: clients,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
      filters: {
        search: dto.search ?? null,
        statut_client: dto.statut_client ?? null,
        type_client: effectiveTypeClient,   
        language_favori: dto.language_favori ?? null,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    };
  }

  async findOne(id_client: string) {
    const client = await this.prisma.clients.findUnique({
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

    if (!client) {
      throw new NotFoundException('Client introuvable.');
    }

    return client;
  }

  async create(dto: CreateClientAdminDto) {
    const email = dto.mail.trim().toLowerCase();

    const existingClient = await this.prisma.clients.findUnique({
      where: { mail: email },
      select: { id_client: true },
    });

    if (existingClient) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const now = new Date();
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const client = await this.prisma.clients.create({
      data: {
        id_client: await this.generateClientId(),
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
        statut_client: dto.statut_client ?? 'Actif',
        type_client: dto.type_client ?? 'Particulier',
        language_favori: dto.language_favori ?? 'FR',
        banned: dto.banned ?? false,
        date_creation: now,
        date_dern_maj: now,
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

    return {
      message: 'Client créé avec succès.',
      client,
    };
  }

  async update(id_client: string, dto: UpdateClientAdminDto) {
    const existing = await this.prisma.clients.findUnique({
      where: { id_client },
      select: { id_client: true, mail: true },
    });

    if (!existing) {
      throw new NotFoundException('Client introuvable.');
    }

    let normalizedEmail: string | undefined;

    if (dto.mail !== undefined) {
      normalizedEmail = dto.mail.trim().toLowerCase();

      const emailOwner = await this.prisma.clients.findUnique({
        where: { mail: normalizedEmail },
        select: { id_client: true },
      });

      if (emailOwner && emailOwner.id_client !== id_client) {
        throw new ConflictException('Un compte existe déjà avec cet email.');
      }
    }

    const client = await this.prisma.clients.update({
      where: { id_client },
      data: {
        ...(normalizedEmail !== undefined && { mail: normalizedEmail }),
        ...(dto.password !== undefined && {
          password: await bcrypt.hash(dto.password, 10),
        }),
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.prenom !== undefined && { prenom: dto.prenom }),
        ...(dto.date_naissance !== undefined && {
          date_naissance: dto.date_naissance ? new Date(dto.date_naissance) : null,
        }),
        ...(dto.pays !== undefined && { pays: dto.pays }),
        ...(dto.prefixe_tel !== undefined && { prefixe_tel: dto.prefixe_tel }),
        ...(dto.num_tel !== undefined && { num_tel: dto.num_tel }),
        ...(dto.statut_client !== undefined && { statut_client: dto.statut_client }),
        ...(dto.type_client !== undefined && { type_client: dto.type_client }),
        ...(dto.language_favori !== undefined && {
          language_favori: dto.language_favori,
        }),
        ...(dto.banned !== undefined && { banned: dto.banned }),
        date_dern_maj: new Date(),
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

    return {
      message: 'Client modifié avec succès.',
      client,
    };
  }

  async remove(id_client: string) {
    const existing = await this.prisma.clients.findUnique({
      where: { id_client },
      select: { id_client: true, mail: true },
    });

    if (!existing) {
      throw new NotFoundException('Client introuvable.');
    }

    const client = await this.prisma.clients.update({
      where: { id_client },
      data: {
        statut_client: 'Rupture relation',
        banned: true,
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
      message: 'Client désactivé avec succès.',
      client,
    };
  }

  private async generateClientId() {
    for (let i = 0; i < 20; i++) {
      const random = Math.floor(10000000 + Math.random() * 90000000);
      const id = `CLI${random}`;

      const exists = await this.prisma.clients.findUnique({
        where: { id_client: id },
        select: { id_client: true },
      });

      if (!exists) {
        return id;
      }
    }

    throw new ConflictException(
      'Impossible de générer un identifiant client unique.',
    );
  }
}