import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvModule } from './common/config/env/env.module';
import { AuthModule } from './auth/auth.module';
import { DomainModule } from './domain/domain.module';

@Module({
  imports: [EnvModule, AuthModule, DomainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
