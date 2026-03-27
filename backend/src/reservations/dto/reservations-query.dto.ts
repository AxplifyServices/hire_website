import { IsBooleanString, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ReservationsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  etape_panier?: string;

  @IsOptional()
  @IsString()
  id_client?: string;

  @IsOptional()
  @IsString()
  id_vehicule?: string;

  @IsOptional()
  @IsString()
  id_lieu_dep?: string;

  @IsOptional()
  @IsString()
  mail?: string;

  @IsOptional()
  @IsBooleanString()
  is_abandoned?: string;

  @IsOptional()
  @IsString()
  date_creation_from?: string;

  @IsOptional()
  @IsString()
  date_creation_to?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}