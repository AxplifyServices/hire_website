import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgencesService } from './agences.service';
import { CreateAgenceDto } from './dto/create-agence.dto';
import { UpdateAgenceDto } from './dto/update-agence.dto';

const agenceImageUpload = FileInterceptor('image', {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const uploadPath = join(process.cwd(), 'storage', 'agences');

      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = extname(file.originalname || '').toLowerCase();
      cb(null, `agence-${uniqueSuffix}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const extension = extname(file.originalname || '').toLowerCase();

    if (!allowed.includes(extension)) {
      return cb(
        new BadRequestException(
          'Format image non supporté. Utilise jpg, jpeg, png ou webp.',
        ) as any,
        false,
      );
    }

    cb(null, true);
  },
});

@Controller('agences')
export class AgencesController {
  constructor(private readonly agencesService: AgencesService) {}

  @Get()
  findAll() {
    return this.agencesService.findAll();
  }

  @Get(':id_agence')
  findOne(@Param('id_agence') id_agence: string) {
    return this.agencesService.findOne(id_agence);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(agenceImageUpload)
  create(
    @Body() dto: CreateAgenceDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.agencesService.create(dto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id_agence')
  @UseInterceptors(agenceImageUpload)
  update(
    @Param('id_agence') id_agence: string,
    @Body() dto: UpdateAgenceDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.agencesService.update(id_agence, dto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id_agence')
  remove(@Param('id_agence') id_agence: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.agencesService.remove(id_agence);
  }

  private assertAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException(
        'Seul un administrateur peut gérer les agences.',
      );
    }
  }
}