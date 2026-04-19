import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListClientsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  statut_client?: string;

  @IsOptional()
  @IsString()
  type_client?: string;

  @IsOptional()
  @IsString()
  language_favori?: string;

  @IsOptional()
  @IsIn(['date_creation', 'date_dern_maj', 'nom', 'prenom', 'mail'])
  sort_by?: 'date_creation' | 'date_dern_maj' | 'nom' | 'prenom' | 'mail' = 'date_creation';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';
}