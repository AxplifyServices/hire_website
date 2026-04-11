import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NewsQueryDto } from './dto/news-query.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: NewsQueryDto) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const where = query.id_agence
      ? { id_agence: query.id_agence }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date_parution: 'desc' }, { id_news: 'desc' }],
        include: {
          agences: {
            select: {
              id_agence: true,
              nom: true,
              ville: true,
              categorie: true,
            },
          },
        },
      }),
      this.prisma.news.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      data,
    };
  }

  async findOne(id_news: string) {
    const news = await this.prisma.news.findUnique({
      where: { id_news },
      include: {
        agences: {
          select: {
            id_agence: true,
            nom: true,
            ville: true,
            categorie: true,
          },
        },
      },
    });

    if (!news) {
      throw new NotFoundException('News introuvable.');
    }

    return news;
  }

  async create(dto: CreateNewsDto) {
    const agence = await this.prisma.agences.findUnique({
      where: { id_agence: dto.id_agence },
      select: {
        id_agence: true,
        nom: true,
        ville: true,
      },
    });

    if (!agence) {
      throw new BadRequestException('Agence introuvable.');
    }

    const now = new Date();
    const news = await this.prisma.news.create({
      data: {
        id_news: await this.generateNextNewsId(),
        id_agence: dto.id_agence,
        date_parution: new Date(dto.date_parution),
        titre: dto.titre.trim(),
        contenu: dto.contenu.trim(),
        date_creation: now,
        date_dern_maj: now,
      },
      include: {
        agences: {
          select: {
            id_agence: true,
            nom: true,
            ville: true,
            categorie: true,
          },
        },
      },
    });

    return {
      message: 'News créée avec succès.',
      news,
    };
  }

  async update(id_news: string, dto: UpdateNewsDto) {
    const existing = await this.prisma.news.findUnique({
      where: { id_news },
      select: {
        id_news: true,
        id_agence: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('News introuvable.');
    }

    if (dto.id_agence) {
      const agence = await this.prisma.agences.findUnique({
        where: { id_agence: dto.id_agence },
        select: { id_agence: true },
      });

      if (!agence) {
        throw new BadRequestException('Agence introuvable.');
      }
    }

    const updated = await this.prisma.news.update({
      where: { id_news },
      data: {
        ...(dto.id_agence ? { id_agence: dto.id_agence } : {}),
        ...(dto.date_parution
          ? { date_parution: new Date(dto.date_parution) }
          : {}),
        ...(dto.titre !== undefined ? { titre: dto.titre.trim() } : {}),
        ...(dto.contenu !== undefined ? { contenu: dto.contenu.trim() } : {}),
        date_dern_maj: new Date(),
      },
      include: {
        agences: {
          select: {
            id_agence: true,
            nom: true,
            ville: true,
            categorie: true,
          },
        },
      },
    });

    return {
      message: 'News modifiée avec succès.',
      news: updated,
    };
  }

  async remove(id_news: string) {
    const existing = await this.prisma.news.findUnique({
      where: { id_news },
      select: { id_news: true, titre: true },
    });

    if (!existing) {
      throw new NotFoundException('News introuvable.');
    }

    await this.prisma.news.delete({
      where: { id_news },
    });

    return {
      message: 'News supprimée avec succès.',
      id_news,
    };
  }

  private async generateNextNewsId(): Promise<string> {
    const lastNews = await this.prisma.news.findFirst({
      where: {
        id_news: {
          startsWith: 'NEW',
        },
      },
      orderBy: {
        id_news: 'desc',
      },
      select: {
        id_news: true,
      },
    });

    if (!lastNews) {
      return 'NEW00000001';
    }

    const lastNumber = Number(lastNews.id_news.replace('NEW', '')) || 0;
    const nextNumber = lastNumber + 1;

    return `NEW${String(nextNumber).padStart(8, '0')}`;
  }
}