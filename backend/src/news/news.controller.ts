import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsQueryDto } from './dto/news-query.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  findAll(@Query() query: NewsQueryDto) {
    return this.newsService.findAll(query);
  }

  @Get(':id_news')
  findOne(@Param('id_news') id_news: string) {
    return this.newsService.findOne(id_news);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateNewsDto, @Req() req: any) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut créer une news.',
      );
    }

    return this.newsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id_news')
  update(
    @Param('id_news') id_news: string,
    @Body() dto: UpdateNewsDto,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut modifier une news.',
      );
    }

    return this.newsService.update(id_news, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id_news')
  remove(@Param('id_news') id_news: string, @Req() req: any) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut supprimer une news.',
      );
    }

    return this.newsService.remove(id_news);
  }
}
