import { Module } from '@nestjs/common';
import { EnvModule } from './common/config/env/env.module';
import { AuthModule } from './auth/auth.module';
import { DomainModule } from './domain/domain.module';
import { MailModule } from './mail/mail.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { WinstonModule } from 'nest-winston';
import { LoggerModule } from './common/modules/logger/logger.module';
import { winstonConfig } from './common/config/winston.config';
import {
  I18nModule,
  AcceptLanguageResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import { YcI18nModule } from './common/modules/yc-i18n/yc-i18n.module';
import * as path from 'path';
import { ResponseTransformerInterceptor } from './common/interceptors/response-transformer.interceptor';

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/localization/'),
        watch: true,
      },
      resolvers: [new AcceptLanguageResolver(), new HeaderResolver(['x-lang'])],
      typesOutputPath: path.join(__dirname, '../../src/i18n/i18n.generated.ts'),
    }),
    LoggerModule,
    EnvModule,
    AuthModule,
    DomainModule,
    MailModule,
    YcI18nModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformerInterceptor,
    },
  ],
})
export class AppModule {}
