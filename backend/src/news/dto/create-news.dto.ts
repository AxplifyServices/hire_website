import { IsDateString, IsString, MaxLength } from 'class-validator';

export class CreateNewsDto {
  @IsString()
  @MaxLength(11)
  id_agence!: string;

  @IsDateString()
  date_parution!: string;

  @IsString()
  @MaxLength(255)
  titre!: string;

  @IsString()
  contenu!: string;
}