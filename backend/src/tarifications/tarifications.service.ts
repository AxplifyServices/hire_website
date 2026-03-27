import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TarificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const tarifications = await this.prisma.tarifications.findMany({
      orderBy: {
        nom: 'asc',
      },
      select: {
        id_tarification: true,
        nom: true,
        description: true,
        qualificatif: true,
        avantages: true,
        discount_rate: true,
      },
    });

    return tarifications.map((item) => ({
      ...item,
      discount_rate:
        item.discount_rate !== null ? Number(item.discount_rate) : null,
    }));
  }
}