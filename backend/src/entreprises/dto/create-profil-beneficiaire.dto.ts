import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsArray,
} from 'class-validator';

export class CreateProfilBeneficiaireDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsString()
  @MaxLength(100)
  libelle!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  validation_requise?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget_plafond_mensuel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nb_jours_mois?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nb_reservations_simultanees?: number;

  @IsOptional()
  @IsBoolean()
  avec_chauffeur_autorise?: boolean;

  @IsOptional()
  @IsBoolean()
  sans_chauffeur_autorise?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  liste_type_autorise?: string[];

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}