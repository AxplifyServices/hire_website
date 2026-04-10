import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollaborateursService } from './collaborateurs.service';

@UseGuards(JwtAuthGuard)
@Controller('collaborateurs')
export class CollaborateursController {
  constructor(
    private readonly collaborateursService: CollaborateursService,
  ) {}

  @Get('me/context')
  getMyContext(@Req() req: any) {
    return this.collaborateursService.getMyContext(req.user);
  }

  @Get('me/entreprises')
  getMyEntreprises(@Req() req: any) {
    return this.collaborateursService.getMyEntreprises(req.user);
  }
}