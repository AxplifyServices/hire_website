import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCodePromoDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Pourcentage', 'Fixe'])
  type_promo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valeur_promo?: number;

  @IsOptional()
  @IsString()
  @IsIn(['Valide', 'Invalide'])
  status?: string;

  @IsOptional()
  @IsDateString()
  date_fin_validite?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nb_max_utilisation?: number;
}