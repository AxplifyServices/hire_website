import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateClientAdminDto {
  @IsEmail()
  mail: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsOptional()
  @IsDateString()
  date_naissance?: string;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsOptional()
  @IsString()
  prefixe_tel?: string;

  @IsOptional()
  @IsString()
  num_tel?: string;

  @IsOptional()
  @IsIn(['Actif', 'Rupture relation'])
  statut_client?: string;

  @IsOptional()
  @IsIn(['Particulier', 'Entreprise'])
  type_client?: string;

  @IsOptional()
  @IsIn(['FR', 'AR', 'EN'])
  language_favori?: string;

  @IsOptional()
  @IsBoolean()
  banned?: boolean;
}