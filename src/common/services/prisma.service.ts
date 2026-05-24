import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { prismaQueryInsights } from '@prisma/sqlcommenter-query-insights';
import { Prisma, PrismaClient } from 'src/generated/prisma/client';
import { env } from '../config/env/env';
import { IPrismaTransactionResult } from './prisma.interface';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: env.DATABASE_URL,
    });
    super({ adapter, comments: [prismaQueryInsights()] });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * A unified method to handle transactions with consistent error handling and response structure.
   * @param callback
   * @returns promise of IPrismaTransactionResult<T>
   * @throws none - handled by the caller to ensure durability of the transaction logic
   * @description This method wraps the Prisma transaction logic and provides a standardized way to handle success and error cases, ensuring that all transactions return a consistent response format.
   */
  async transaction<T>(
    callback: (
      prisma: Prisma.TransactionClient,
    ) => Promise<IPrismaTransactionResult<T>>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<IPrismaTransactionResult<T>> {
    return await this.$transaction(callback, options);
  }
}
