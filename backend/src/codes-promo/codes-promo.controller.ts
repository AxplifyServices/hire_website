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
import { CodesPromoService } from './codes-promo.service';
import { ListCodesPromoDto } from './dto/list-codes-promo.dto';
import { CreateCodePromoDto } from './dto/create-code-promo.dto';
import { UpdateCodePromoDto } from './dto/update-code-promo.dto';

@UseGuards(JwtAuthGuard)
@Controller('codes-promo')
export class CodesPromoController {
  constructor(private readonly codesPromoService: CodesPromoService) {}

  @Get()
  findAll(@Query() dto: ListCodesPromoDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.codesPromoService.findAll(dto);
  }

  @Get(':id_coupon')
  findOne(@Param('id_coupon') id_coupon: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.codesPromoService.findOne(id_coupon);
  }

  @Post()
  create(@Body() dto: CreateCodePromoDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.codesPromoService.create(dto, req.user);
  }

  @Patch(':id_coupon')
  update(
    @Param('id_coupon') id_coupon: string,
    @Body() dto: UpdateCodePromoDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.codesPromoService.update(id_coupon, dto);
  }

  @Delete(':id_coupon')
  remove(@Param('id_coupon') id_coupon: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.codesPromoService.remove(id_coupon);
  }

  private assertAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException(
        'Seul un administrateur peut gérer les coupons.',
      );
    }
  }
}