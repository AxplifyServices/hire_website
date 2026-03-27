import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class SearchVehiculesDto {
  @IsString()
  id_agence_depart: string;

  @IsDateString()
  date_dep: string;

  @IsDateString()
  date_ret: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'heure_dep doit être au format HH:mm ou HH:mm:ss',
  })
  heure_dep?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'heure_ret doit être au format HH:mm ou HH:mm:ss',
  })
  heure_ret?: string;
}