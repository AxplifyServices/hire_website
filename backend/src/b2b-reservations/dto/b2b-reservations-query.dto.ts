import { IsIn, IsOptional, IsString } from 'class-validator';

export class B2bReservationsQueryDto {
  @IsOptional()
  @IsString()
  statut_reservation?: string;

  @IsOptional()
  @IsString()
  statut_validation?: string;

  @IsOptional()
  @IsString()
  id_entreprise?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_date_creation?: 'asc' | 'desc';
}