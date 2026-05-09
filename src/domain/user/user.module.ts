import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/common/services/prisma.service';
import { AuthUtilsService } from 'src/auth/auth.utils.service';

@Module({
  providers: [UserService, PrismaService, AuthUtilsService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
