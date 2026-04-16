import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class SignUpDTO {
  @IsEmail()
  email: string;
  @IsString()
  @Length(8, 32)
  password: string;
  @IsString()
  @Length(2, 20)
  passwordConfirm: string;
  @IsString()
  @Length(2, 20)
  firstName: string;
  @IsOptional()
  @IsString()
  @Length(2, 20)
  lastName: string;
  @IsOptional()
  @IsString()
  providerId?: string;
}
