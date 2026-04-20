import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCollaborateurDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  prenom?: string;

  @IsOptional()
  @IsEmail()
  mail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefixe_tel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  num_tel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pays?: string;

  @IsOptional()
  date_naissance?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  id_centre_cout?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  id_profil_beneficiaire?: string;

  @IsOptional()
  @IsString()
  @IsIn(['self', 'autre'])
  validateur?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  manager_id_client_entreprise?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role_entreprise?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  matricule?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language_favori?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}