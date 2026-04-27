import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { CaslFactory } from './casl.factory';
import { CaslGuard } from './casl.guard';

@Module({
  providers: [PrismaService, CaslFactory, CaslGuard],
  exports: [CaslFactory, CaslGuard],
})
export class CaslModule {}
