import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TarificationsService } from './tarifications.service';
import { ListTarificationsDto } from './dto/list-tarifications.dto';
import { CreateTarificationDto } from './dto/create-tarification.dto';
import { UpdateTarificationDto } from './dto/update-tarification.dto';

@Controller('tarifications')
export class TarificationsController {
  constructor(private readonly tarificationsService: TarificationsService) {}

  // =========================
  // PUBLIC - compatible site
  // =========================

  @Get()
  findAllPublic() {
    return this.tarificationsService.findPublic();
  }

  // =========================
  // ADMIN
  // =========================

  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  findAllAdmin(@Query() dto: ListTarificationsDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.tarificationsService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTarificationDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.tarificationsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id_tarification')
  update(
    @Param('id_tarification') id_tarification: string,
    @Body() dto: UpdateTarificationDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.tarificationsService.update(id_tarification, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id_tarification')
  remove(@Param('id_tarification') id_tarification: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.tarificationsService.remove(id_tarification);
  }

  @Get(':id_tarification')
  findOne(@Param('id_tarification') id_tarification: string) {
    return this.tarificationsService.findOne(id_tarification);
  }

  private assertAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException(
        'Seul un administrateur peut gérer les tarifications.',
      );
    }
  }
}