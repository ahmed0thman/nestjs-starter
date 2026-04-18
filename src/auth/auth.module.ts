import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/domain/user/user.module';
import { MailModule } from 'src/mail/mail.module';
import { env } from 'src/common/config/env/env';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UserModule,
    MailModule,
    PassportModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      // access tokens will expire in 15 minutes, you can adjust this as needed
      signOptions: { expiresIn: env.JWT_ACCESS_TOKEN_EXP as undefined },
      // refresh tokens will expire in 7 days, you can adjust this as needed

      global: true, // Make the JwtModule available globally, so you don't need to import it in other modules
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
