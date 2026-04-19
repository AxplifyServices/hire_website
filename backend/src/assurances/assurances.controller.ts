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
import { AssurancesService } from './assurances.service';
import { ListAssurancesDto } from './dto/list-assurances.dto';
import { CreateAssuranceDto } from './dto/create-assurance.dto';
import { UpdateAssuranceDto } from './dto/update-assurance.dto';

@Controller('assurances')
export class AssurancesController {
  constructor(private readonly assurancesService: AssurancesService) {}

  // =========================
  // PUBLIC - compatible front réservation
  // =========================

  @Get()
  findPublic() {
    return this.assurancesService.findPublic();
  }

  // =========================
  // ADMIN
  // =========================

  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  findAllAdmin(@Query() dto: ListAssurancesDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.assurancesService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateAssuranceDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.assurancesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id_assurance')
  update(
    @Param('id_assurance') id_assurance: string,
    @Body() dto: UpdateAssuranceDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.assurancesService.update(id_assurance, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id_assurance')
  remove(@Param('id_assurance') id_assurance: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.assurancesService.remove(id_assurance);
  }

  @Get(':id_assurance')
  findOne(@Param('id_assurance') id_assurance: string) {
    return this.assurancesService.findOne(id_assurance);
  }

  private assertAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException(
        'Seul un administrateur peut gérer les assurances.',
      );
    }
  }
}