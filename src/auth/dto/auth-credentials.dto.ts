import { IsNotEmpty } from 'class-validator';
import { PickType } from '@nestjs/mapped-types';
import { localesValidation } from 'src/common/modules/yc-i18n/locals-validations';
import { SignUpDTO } from './sign-up.dto';

export class AuthCredentialsDTO extends PickType(SignUpDTO, [
  'email',
  'password',
]) {
  @IsNotEmpty({ message: localesValidation('validations.email.is_required') })
  email!: string;

  @IsNotEmpty({
    message: localesValidation('validations.password.is_required'),
  })
  password!: string;
}
