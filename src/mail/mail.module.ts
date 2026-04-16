import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';

@Module({
  providers: [MailService, AppLoggerService],
  exports: [MailService],
})
export class MailModule {}
