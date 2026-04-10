import { IsOptional, IsString } from 'class-validator';

export class RejectValidationDto {
  @IsOptional()
  @IsString()
  commentaire?: string;
}