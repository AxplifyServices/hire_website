import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCentreCoutDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsString()
  @MaxLength(150)
  libelle!: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}