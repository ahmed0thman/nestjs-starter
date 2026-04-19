import { IsNotEmpty } from 'class-validator';
import { localesValidation } from 'src/common/modules/yc-i18n/locals-validations';

export class VerifyEmailDTO {
  userId!: string;
  @IsNotEmpty({
    message: localesValidation('validations.verifyEmail.is_required'),
  })
  secret!: string;
}
