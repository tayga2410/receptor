import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class GoogleAuthDto {
  @IsString()
  idToken: string;
}

export class TelegramAuthDto {
  @IsString()
  id: string;

  @IsString()
  hash: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsOptional()
  @IsString()
  auth_date?: string;
}
