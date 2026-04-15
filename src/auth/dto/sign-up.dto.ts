import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class SignUpDTO {
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @IsString()
  @Length(8, 32)
  password: string;
  @IsNotEmpty()
  @IsString()
  @Length(2, 20)
  firstName: string;
  @IsNotEmpty()
  @IsString()
  @Length(2, 20)
  lastName: string;
  @IsOptional()
  @IsString()
  providerId?: string;
}
