import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Match } from 'src/common/decorators/input-dto-match.decorator';
import { localesValidation } from 'src/common/modules/yc-i18n/locals-validations';

export class SignUpDTO {
  @IsNotEmpty({ message: localesValidation('validations.email.is_required') })
  @IsEmail(
    {},
    { message: localesValidation('validations.email.is_not_correct') },
  )
  email!: string;
  // =======
  @IsNotEmpty({
    message: localesValidation('validations.password.is_required'),
  })
  @Length(8, 32, { message: localesValidation('validations.password.length') })
  password!: string;
  // =======
  @IsNotEmpty({
    message: localesValidation('validations.password.is_required'),
  })
  @Match('password', {
    message: localesValidation('validations.password.not_confirmed'),
  })
  passwordConfirm!: string;
  // =======
  @IsNotEmpty({
    message: localesValidation('validations.firstName.is_required'),
  })
  @IsString({ message: localesValidation('validations.firstName.is_string') })
  @Length(2, 50, { message: localesValidation('validations.firstName.length') })
  firstName!: string;
  // ======
  @IsOptional()
  @IsString({ message: localesValidation('validations.lastName.is_string') })
  @Length(2, 50, { message: localesValidation('validations.lastName.length') })
  lastName!: string;
  // ======
  @IsOptional()
  @IsString({
    message: localesValidation('validations.provider.is_not_correct'),
  })
  providerId?: string;
}
