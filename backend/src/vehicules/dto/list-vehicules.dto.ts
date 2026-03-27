import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListVehiculesDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @IsOptional()
  @IsString()
  id_agence_actuelle?: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsString()
  marque?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  carburant?: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsBooleanString()
  climatisation?: string;

  @IsOptional()
  @IsString()
  disponibilite?: string;

  @IsOptional()
  @IsString()
  status_vehicule?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nb_place_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nb_porte_min?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  prix_jour_min?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  prix_jour_max?: number;

  @IsOptional()
  @IsIn(['prix_jour', 'nom', 'marque', 'date_creation'])
  sort_by?: 'prix_jour' | 'nom' | 'marque' | 'date_creation';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';
}