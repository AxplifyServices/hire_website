import { IsOptional, IsString } from 'class-validator';

export class ApproveValidationDto {
  @IsOptional()
  @IsString()
  commentaire?: string;
}