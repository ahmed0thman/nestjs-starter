import { Module } from '@nestjs/common';
import { EnvModule } from './common/config/env/env.module';
import { AuthModule } from './auth/auth.module';
import { DomainModule } from './domain/domain.module';
import { MailModule } from './mail/mail.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { WinstonModule } from 'nest-winston';
import { LoggerModule } from './common/modules/logger/logger.module';
import { winstonConfig } from './common/config/winston.config';

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    LoggerModule,
    EnvModule,
    AuthModule,
    DomainModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
