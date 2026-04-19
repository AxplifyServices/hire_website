import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCodePromoDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsIn(['Pourcentage', 'Fixe'])
  type_promo: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valeur_promo: number;

  @IsString()
  @IsIn(['Valide', 'Invalide'])
  status: string;

  @IsOptional()
  @IsDateString()
  date_fin_validite?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nb_max_utilisation?: number;
}