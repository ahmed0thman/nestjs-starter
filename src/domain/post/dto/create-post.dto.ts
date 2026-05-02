import { IsNotEmpty, Length } from 'class-validator';
import { localesValidation } from 'src/common/modules/yc-i18n/locals-validations';

export class CreatePostDTO {
  @IsNotEmpty({ message: localesValidation('validations.title.is_required') })
  @Length(5, 100, { message: localesValidation('validations.title.length') })
  title!: string;

  @IsNotEmpty({ message: localesValidation('validations.content.is_required') })
  @Length(10, 5000, {
    message: localesValidation('validations.content.length'),
  })
  content!: string;
}
