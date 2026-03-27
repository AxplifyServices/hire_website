import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgencesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.agences.findMany({
      where: { is_active: true },
      orderBy: { nom: 'asc' },
    });
  }
}