import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssurancesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const assurances = await this.prisma.assurances.findMany({
      orderBy: {
        nom: 'asc',
      },
      select: {
        id_assurance: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        prix_jour: true,
      },
    });

    return assurances.map((item) => ({
      ...item,
      prix_jour: item.prix_jour !== null ? Number(item.prix_jour) : null,
    }));
  }
}