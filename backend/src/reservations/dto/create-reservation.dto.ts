import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateReservationDto {
  @IsString()
  id_vehicule: string;

  @IsDateString()
  date_dep: string;

  @IsDateString()
  date_ret: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'heure_dep doit être au format HH:mm ou HH:mm:ss',
  })
  heure_dep: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'heure_ret doit être au format HH:mm ou HH:mm:ss',
  })
  heure_ret: string;

  @IsString()
  id_lieu_dep: string;

  @IsString()
  id_lieu_ret: string;

  @IsBoolean()
  retour_different: boolean;

  @IsString()
  id_tarification: string;

  @IsOptional()
  @IsString()
  id_assurance?: string;

  @IsOptional()
  @IsArray()
  liste_id_option?: string[];

  @IsString()
  id_politique_age: string;

  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsEmail()
  mail: string;

  @IsOptional()
  @IsString()
  prefixe_tel?: string;

  @IsOptional()
  @IsString()
  num_tel?: string;

  @IsOptional()
  @IsDateString()
  date_naissance?: string;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsOptional()
  @IsString()
  code_promo?: string;

  @IsOptional()
  @IsString()
  devise?: string;
}