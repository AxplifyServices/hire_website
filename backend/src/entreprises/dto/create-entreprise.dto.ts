import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEntrepriseDto {
  @IsString()
  @MaxLength(150)
  raison_sociale: string;

  @IsString()
  @MaxLength(150)
  slug: string;

  @IsOptional()
  @IsEmail()
  email_contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tel_contact?: string;

  @IsOptional()
  @IsIn(['actif', 'inactif', 'suspendu'])
  statut?: string;

  @IsOptional()
  @IsIn(['automatique', 'manuelle', 'mixte'])
  mode_validation_defaut?: string;

  @IsOptional()
  @IsIn(['MAD', 'EUR', 'USD'])
  devise?: string;
}