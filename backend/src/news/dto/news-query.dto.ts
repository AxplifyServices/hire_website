import { IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class NewsQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  id_agence?: string;
}