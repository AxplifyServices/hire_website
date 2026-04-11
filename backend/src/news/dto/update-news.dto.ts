import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  @MaxLength(11)
  id_agence?: string;

  @IsOptional()
  @IsDateString()
  date_parution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  titre?: string;

  @IsOptional()
  @IsString()
  contenu?: string;
}