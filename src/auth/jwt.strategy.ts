import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { env } from 'src/common/config/env/env';
import { UserService } from 'src/domain/user/user.service';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import AppError from 'src/common/errors/app.error';
import { JwtPayload } from './payloads/jwt.payload';
import { cookieExtractor } from 'src/utils/cookies.utils';
import { Request } from 'express';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly ycI18nService: YcI18nService,
    private readonly logger: AppLoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => cookieExtractor(req, 'accessToken'),
      ]),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    // this.logger.log(
    //   `JWT Strategy: Validating payload ${JSON.stringify(payload)}`,
    //   'JwtStrategy',
    // );
    const { sub, iat } = payload;
    const user = await this.userService.findUserById(sub);
    if (!user) {
      throw AppError.unauthorized(this.ycI18nService.t('errors.invalid_token'));
    }

    // Check if the token was issued before the last password change
    if (user.authSecurities?.lastPasswordChange) {
      const lastPasswordChange = Math.floor(
        new Date(user.authSecurities.lastPasswordChange).getTime() / 1000,
      );
      if (iat < lastPasswordChange) {
        throw AppError.unauthorized(
          this.ycI18nService.t('errors.invalid_token'),
        );
      }
    }
    return user;
  }
}
