import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { CaslModule } from './common/modules/casl/casl.module';
import { CaslGuard } from './common/modules/casl/casl.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RequestMetadataMiddleware } from './common/middleware/request-metadata.middleware';

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
    CaslModule,
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
    {
      provide: 'APP_GUARD',
      useExisting: JwtAuthGuard,
    },
    {
      provide: 'APP_GUARD',
      useExisting: CaslGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestMetadataMiddleware).forRoutes('*');
  }
}
