import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAgenceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ville?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  num_tel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  num_tel_deux?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  mail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  disponibilite_agence?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  categorie?: string;
}