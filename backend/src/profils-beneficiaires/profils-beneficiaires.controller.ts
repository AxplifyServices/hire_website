import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfilsBeneficiairesService } from './profils-beneficiaires.service';
import { UpdateProfilBeneficiaireDto } from './dto/update-profil-beneficiaire.dto';

@UseGuards(JwtAuthGuard)
@Controller('profils-beneficiaires')
export class ProfilsBeneficiairesController {
  constructor(
    private readonly profilsBeneficiairesService: ProfilsBeneficiairesService,
  ) {}

  @Patch(':id_profil_beneficiaire')
  updateProfilBeneficiaire(
    @Param('id_profil_beneficiaire') id_profil_beneficiaire: string,
    @Body() dto: UpdateProfilBeneficiaireDto,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut modifier un profil bénéficiaire.',
      );
    }

    return this.profilsBeneficiairesService.updateProfilBeneficiaire(
      id_profil_beneficiaire,
      dto,
    );
  }

  @Delete(':id_profil_beneficiaire')
  removeProfilBeneficiaire(
    @Param('id_profil_beneficiaire') id_profil_beneficiaire: string,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut supprimer un profil bénéficiaire.',
      );
    }

    return this.profilsBeneficiairesService.removeProfilBeneficiaire(
      id_profil_beneficiaire,
    );
  }
}