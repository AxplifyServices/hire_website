import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateCartDto extends PartialType(CreateCartDto) {
  @IsOptional()
  @IsString()
  id_vehicule?: string;

  @IsOptional()
  @IsString()
  id_tarification?: string;

  @IsOptional()
  @IsString()
  id_assurance?: string;

  @IsOptional()
  @IsArray()
  liste_id_option?: string[];

  @IsOptional()
  @IsString()
  id_politique_age?: string;

  @IsOptional()
  @IsBoolean()
  retour_different?: boolean;

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

  @IsOptional()
  @IsString()
  etape_panier?: string;
}