import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsQueryDto } from './dto/reservations-query.dto';
import { QuoteDto } from './dto/quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AbandonedCartsService } from './abandoned-carts/abandoned-carts.service';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly abandonedCartsService: AbandonedCartsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() query: ReservationsQueryDto, @Req() req: any) {
    const user = req.user || null;
    return this.reservationsService.findAll(query, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('prefill')
  async getPrefill(@Req() req: any) {
    const user = req.user || null;
    return this.reservationsService.getPrefill(user);
  }

  @Post('quote')
  async quote(@Body() dto: QuoteDto) {
    return this.reservationsService.quote(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMine(@Query() query: ReservationsQueryDto, @Req() req: any) {
    const user = req.user || null;
    return this.reservationsService.findMine(query, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async createCart(@Body() dto: any, @Req() req: any) {
    const user = req.user || null;
    return this.reservationsService.createCart(dto, user);
  }

  // =========================
  // ADMIN ACTIONS
  // =========================

  @UseGuards(JwtAuthGuard)
  @Post(':id/admin/start')
  async startReservation(@Param('id') id: string, @Req() req: any) {
    const user = req.user || null;
    return this.reservationsService.startReservation(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/admin/complete')
  async completeReservation(@Param('id') id: string, @Req() req: any) {
    const user = req.user || null;
    return this.reservationsService.completeReservation(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/admin/cancel')
  async cancelReservation(@Param('id') id: string, @Req() req: any) {
    const user = req.user || null;
    return this.reservationsService.cancelReservation(id, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user || null;
    const session_panier = req.headers['x-session-id'] || null;

    return this.reservationsService.findOne(id, user, session_panier);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Patch(':id')
  async updateCart(
    @Param('id') id: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    const user = req.user || null;
    const session_panier = req.headers['x-session-id'] || null;

    return this.reservationsService.updateCart(id, dto, user, session_panier);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/finalize')
  async finalizeCart(@Param('id') id: string, @Req() req: any) {
    const user = req.user || null;
    const session_panier = req.headers['x-session-id'] || null;

    return this.reservationsService.finalizeCart(id, user, session_panier);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/abandon')
  async abandonCart(@Param('id') id: string, @Req() req: any) {
    const user = req.user || null;
    const session_panier = req.headers['x-session-id'] || null;

    return this.reservationsService.abandonCart(id, user, session_panier);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/resume')
  async resumeCart(@Param('id') id: string, @Req() req: any) {
    const user = req.user || null;
    const session_panier = req.headers['x-session-id'] || null;

    return this.reservationsService.resumeCart(id, user, session_panier);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/recovery-link')
  async getRecoveryLink(@Param('id') id: string, @Req() req: any) {
    const user = req.user || null;
    const session_panier = req.headers['x-session-id'] || null;

    return this.abandonedCartsService.generateRecoveryLinkForReservation(
      id,
      user,
      session_panier,
    );
  }

  @Post('resume-by-token')
  async resumeCartByToken(
    @Body() body: { token?: string },
    @Query('token') tokenQuery: string,
    @Req() req: any,
  ) {
    const token = body?.token || tokenQuery;

    if (!token) {
      throw new BadRequestException('Token requis');
    }

    const { id_reservation, session_panier } =
      this.abandonedCartsService.validateRecoveryToken(token);

    const user = req.user || null;

    return this.reservationsService.resumeCart(
      id_reservation,
      user,
      session_panier,
    );
  }
}