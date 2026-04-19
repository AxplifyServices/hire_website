import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { VehiculesService } from './vehicules.service';
import { SearchVehiculesDto } from './dto/search-vehicules.dto';
import { ListVehiculesDto } from './dto/list-vehicules.dto';
import { CreateVehiculeDto } from './dto/create-vehicule.dto';
import { UpdateVehiculeDto } from './dto/update-vehicule.dto';

const vehiculeImageUpload = FileInterceptor('image', {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const uploadPath = join(process.cwd(), 'storage', 'vehicules');

      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = extname(file.originalname || '').toLowerCase();
      cb(null, `vehicule-${uniqueSuffix}${extension}`);
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

@Controller('vehicules')
export class VehiculesController {
  constructor(private readonly vehiculesService: VehiculesService) {}

  @Get()
  findAll(@Query() dto: ListVehiculesDto) {
    return this.vehiculesService.findAll(dto);
  }

  @Get('search')
  search(@Query() dto: SearchVehiculesDto) {
    return this.vehiculesService.search(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiculesService.findOne(id);
  }

  @Post()
  @UseInterceptors(vehiculeImageUpload)
  create(
    @Body() dto: CreateVehiculeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.vehiculesService.create(dto, file);
  }

  @Patch(':id')
  @UseInterceptors(vehiculeImageUpload)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehiculeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.vehiculesService.update(id, dto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiculesService.remove(id);
  }
}