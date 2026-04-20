import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { B2bReservationsService } from './b2b-reservations.service';
import { B2bQuoteDto } from './dto/b2b-quote.dto';
import { CreateB2bReservationDto } from './dto/create-b2b-reservation.dto';
import { B2bReservationsQueryDto } from './dto/b2b-reservations-query.dto';
import { ApproveValidationDto } from './dto/approve-validation.dto';
import { RejectValidationDto } from './dto/reject-validation.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class B2bReservationsController {
  constructor(
    private readonly b2bReservationsService: B2bReservationsService,
  ) {}

  @Post('b2b-reservations/quote')
  quote(@Body() dto: B2bQuoteDto, @Req() req: any) {
    return this.b2bReservationsService.quote(dto, req.user);
  }

  @Post('b2b-reservations')
  create(@Body() dto: CreateB2bReservationDto, @Req() req: any) {
    return this.b2bReservationsService.create(dto, req.user);
  }

  @Get('b2b-reservations/me')
  findMine(@Query() query: B2bReservationsQueryDto, @Req() req: any) {
    return this.b2bReservationsService.findMine(query, req.user);
  }

  @Get('admin/b2b-reservations')
  findAdmin(@Query() query: B2bReservationsQueryDto, @Req() req: any) {
    return this.b2bReservationsService.findAdmin(query, req.user);
  }

  @Get('b2b-validations/me')
  findValidationsForMe(@Req() req: any) {
    return this.b2bReservationsService.findValidationsForMe(req.user);
  }

  @Post('b2b-validations/:id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveValidationDto,
    @Req() req: any,
  ) {
    return this.b2bReservationsService.approveValidation(
      id,
      req.user,
      dto.commentaire,
    );
  }

  @Post('b2b-validations/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectValidationDto,
    @Req() req: any,
  ) {
    return this.b2bReservationsService.rejectValidation(
      id,
      req.user,
      dto.commentaire,
    );
  }

  @Post('admin/b2b-reservations/:id/start')
  start(@Param('id') id: string, @Req() req: any) {
    return this.b2bReservationsService.startReservation(id, req.user);
  }

  @Post('admin/b2b-reservations/:id/complete')
  complete(@Param('id') id: string, @Req() req: any) {
    return this.b2bReservationsService.completeReservation(id, req.user);
  }

  @Post('admin/b2b-reservations/:id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.b2bReservationsService.cancelReservation(id, req.user);
  }
}