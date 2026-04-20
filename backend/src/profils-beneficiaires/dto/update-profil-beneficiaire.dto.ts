import { PartialType } from '@nestjs/mapped-types';
import { CreateProfilBeneficiaireDto } from '../../entreprises/dto/create-profil-beneficiaire.dto';

export class UpdateProfilBeneficiaireDto extends PartialType(
  CreateProfilBeneficiaireDto,
) {}