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
import { OptionsService } from './options.service';
import { ListOptionsDto } from './dto/list-options.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  // =========================
  // PUBLIC - compatible front réservation
  // =========================

  @Get()
  findPublic() {
    return this.optionsService.findPublic();
  }

  @Get(':id_option')
  findOne(@Param('id_option') id_option: string) {
    return this.optionsService.findOne(id_option);
  }

  // =========================
  // ADMIN
  // =========================

  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  findAllAdmin(@Query() dto: ListOptionsDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.optionsService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOptionDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.optionsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id_option')
  update(
    @Param('id_option') id_option: string,
    @Body() dto: UpdateOptionDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.optionsService.update(id_option, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id_option')
  remove(@Param('id_option') id_option: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.optionsService.remove(id_option);
  }

  private assertAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException(
        'Seul un administrateur peut gérer les options.',
      );
    }
  }
}