import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
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
  @IsBoolean()
  actif?: boolean;
}