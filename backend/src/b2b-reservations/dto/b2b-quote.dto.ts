import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class B2bQuoteDto {
  @IsString()
  id_client_entreprise_demandeur!: string;

  @IsOptional()
  @IsString()
  id_client_entreprise_beneficiaire?: string;

  @IsOptional()
  @IsString()
  id_centre_cout?: string;

  @IsOptional()
  @IsString()
  id_profil_beneficiaire?: string;

  @IsString()
  id_vehicule!: string;

  @IsString()
  id_agence_depart!: string;

  @IsOptional()
  @IsString()
  id_agence_retour?: string;

  // 🔹 Nouveau : type + localisation départ
  @IsOptional()
  @IsIn(['agence', 'localisation'])
  type_lieu_depart?: 'agence' | 'localisation';

  @IsOptional()
  @IsString()
  adresse_depart?: string;

  @IsOptional()
  @Type(() => Number)
  latitude_depart?: number;

  @IsOptional()
  @Type(() => Number)
  longitude_depart?: number;

  // 🔹 Nouveau : type + localisation retour
  @IsOptional()
  @IsIn(['agence', 'localisation'])
  type_lieu_retour?: 'agence' | 'localisation';

  @IsOptional()
  @IsString()
  adresse_retour?: string;

  @IsOptional()
  @Type(() => Number)
  latitude_retour?: number;

  @IsOptional()
  @Type(() => Number)
  longitude_retour?: number;

  @IsDateString()
  date_dep!: string;

  @IsDateString()
  date_ret!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'heure_dep doit être au format HH:mm ou HH:mm:ss',
  })
  heure_dep!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'heure_ret doit être au format HH:mm ou HH:mm:ss',
  })
  heure_ret!: string;

  @IsOptional()
  @IsBoolean()
  avec_chauffeur?: boolean;

  @IsOptional()
  @IsString()
  type_trajet?: string;

  @IsOptional()
  @IsString()
  lieu_prise_en_charge?: string;

  @IsOptional()
  @IsString()
  lieu_destination?: string;

  @IsOptional()
  @IsString()
  id_tarification?: string;

  @IsOptional()
  @IsString()
  id_assurance?: string;
}