import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollaborateursService } from './collaborateurs.service';
import { UpdateCollaborateurDto } from './dto/update-collaborateur.dto';

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

  @Patch(':id_client_entreprise')
  updateCollaborateur(
    @Param('id_client_entreprise') id_client_entreprise: string,
    @Body() dto: UpdateCollaborateurDto,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut modifier un collaborateur.',
      );
    }

    return this.collaborateursService.updateCollaborateur(
      id_client_entreprise,
      dto,
    );
  }

  @Delete(':id_client_entreprise')
  removeCollaborateur(
    @Param('id_client_entreprise') id_client_entreprise: string,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut supprimer un collaborateur.',
      );
    }

    return this.collaborateursService.removeCollaborateur(
      id_client_entreprise,
    );
  }
}