import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  IsIn,
} from 'class-validator';

export class CreateCartDto {
  @IsOptional()
  @IsString()
  session_panier?: string;

  @IsOptional()
  @IsString()
  id_lieu_dep?: string;

  @IsOptional()
  @IsString()
  id_lieu_ret?: string;

  @IsOptional()
  @IsDateString()
  date_dep?: string;

  @IsOptional()
  @IsDateString()
  date_ret?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'heure_dep doit être au format HH:mm ou HH:mm:ss',
  })
  heure_dep?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'heure_ret doit être au format HH:mm ou HH:mm:ss',
  })
  heure_ret?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsEmail()
  mail?: string;

  @IsOptional()
  @IsString()
  prefixe_tel?: string;

  @IsOptional()
  @IsString()
  num_tel?: string;

  @IsOptional()
  @IsString()
  @IsIn(['not_started', 'pending', 'paid', 'failed'], {
    message: "payment_status doit être l'une des valeurs suivantes : not_started, pending, paid, failed",
  })
  payment_status?: string;

  // ✅ NOUVEAU
  @IsOptional()
  @IsString()
  code_promo?: string;
}