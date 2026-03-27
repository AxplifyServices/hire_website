import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const options = await this.prisma.options.findMany({
      orderBy: {
        nom: 'asc',
      },
      select: {
        id_option: true,
        nom: true,
        description: true,
        qualificatif: true,
        prix_jour: true,
      },
    });

    return options.map((item) => ({
      ...item,
      prix_jour: item.prix_jour !== null ? Number(item.prix_jour) : null,
    }));
  }
}