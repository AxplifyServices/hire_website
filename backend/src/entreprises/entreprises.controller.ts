import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EntreprisesService } from './entreprises.service';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto';
import { CreateCollaborateurDto } from './dto/create-collaborateur.dto';
import { CreateCentreCoutDto } from './dto/create-centre-cout.dto';
import { CreateProfilBeneficiaireDto } from './dto/create-profil-beneficiaire.dto';

@UseGuards(JwtAuthGuard)
@Controller('entreprises')
export class EntreprisesController {
  constructor(private readonly entreprisesService: EntreprisesService) {}

  @Post()
  createEntreprise(@Body() dto: CreateEntrepriseDto, @Req() req: any) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut créer une entreprise.',
      );
    }

    return this.entreprisesService.createEntreprise(dto);
  }

  @Post(':id_entreprise/centres-cout')
  createCentreCout(
    @Param('id_entreprise') id_entreprise: string,
    @Body() dto: CreateCentreCoutDto,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut créer un centre de coût.',
      );
    }

    return this.entreprisesService.createCentreCout(id_entreprise, dto);
  }

  @Post(':id_entreprise/profils-beneficiaires')
  createProfilBeneficiaire(
    @Param('id_entreprise') id_entreprise: string,
    @Body() dto: CreateProfilBeneficiaireDto,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut créer un profil bénéficiaire.',
      );
    }

    return this.entreprisesService.createProfilBeneficiaire(id_entreprise, dto);
  }

  @Post(':id_entreprise/collaborateurs')
  createCollaborateur(
    @Param('id_entreprise') id_entreprise: string,
    @Body() dto: CreateCollaborateurDto,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut créer un collaborateur entreprise.',
      );
    }

    return this.entreprisesService.createCollaborateur(id_entreprise, dto);
  }

  @Get(':id_entreprise')
  findOne(@Param('id_entreprise') id_entreprise: string, @Req() req: any) {
    return this.entreprisesService.findOne(id_entreprise, req.user);
  }

  @Get(':id_entreprise/centres-cout')
  findCentresCout(
    @Param('id_entreprise') id_entreprise: string,
    @Req() req: any,
  ) {
    return this.entreprisesService.findCentresCout(id_entreprise, req.user);
  }

  @Get(':id_entreprise/profils-beneficiaires')
  findProfilsBeneficiaires(
    @Param('id_entreprise') id_entreprise: string,
    @Req() req: any,
  ) {
    return this.entreprisesService.findProfilsBeneficiaires(
      id_entreprise,
      req.user,
    );
  }

  @Get(':id_entreprise/collaborateurs')
  findCollaborateurs(
    @Param('id_entreprise') id_entreprise: string,
    @Req() req: any,
  ) {
    return this.entreprisesService.findCollaborateurs(id_entreprise, req.user);
  }
}