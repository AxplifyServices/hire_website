import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  mail: string;

  @IsString()
  @MinLength(6)
  password: string;
}