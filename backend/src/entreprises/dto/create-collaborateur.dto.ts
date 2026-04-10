import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCollaborateurDto {
  @IsString()
  @MaxLength(100)
  nom!: string;

  @IsString()
  @MaxLength(100)
  prenom!: string;

  @IsEmail()
  mail!: string;

  @IsString()
  @MaxLength(100)
  password!: string;

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

  // Temporaire : champ de payload, non stocké en base
  @IsString()
  @IsIn(['self', 'autre'])
  validateur!: string;

  // Obligatoire seulement si validateur = "autre"
  @IsOptional()
  @IsString()
  @MaxLength(11)
  manager_id_client_entreprise?: string;

  @IsString()
  @MaxLength(50)
  role_entreprise!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  matricule?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language_favori?: string;
}