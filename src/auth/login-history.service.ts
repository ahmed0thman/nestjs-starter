import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { RequestMetadata } from 'src/utils/request-metadata.utils';

@Injectable()
export class LoginHistoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ycI18nService: YcI18nService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Creates a login history entry in the database with the provided request metadata, user ID, and success status.
   * @param requestMeta
   * @param userId
   * @param success
   * @returns
   */
  async createLoginHistory(
    requestMeta: RequestMetadata,
    userId: string | null,
    success: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const prismaClient = tx ?? this.prismaService;
    const loginHistory = await prismaClient.loginHistory.create({
      data: {
        userId,
        action: 'login',
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        device: requestMeta.device,
        deviceType: requestMeta.deviceType,
        os: requestMeta.os,
        browser: requestMeta.browser,
        deviceId: requestMeta.deviceId,
        geoCountry: requestMeta.geoCountry,
        geoCity: requestMeta.geoCity,
        geoLatitude: Number(requestMeta.geoLatitude),
        geoLongitude: Number(requestMeta.geoLongitude),
        success,
        isSecure: requestMeta.isSecure,
      },
      select: {
        id: true,
      },
    });
    return loginHistory.id;
  }

  async updateLoginHistoryAsFailed(
    loginHistoryId: string,
    failureReason: string,
    isSuspicious: boolean = false,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx ?? this.prismaService;
    await prismaClient.loginHistory.update({
      where: { id: loginHistoryId },
      data: {
        success: false,
        failureReason,
        isSuspicious,
      },
    });
  }

  async updateLoginHistoryAsSuccess(
    loginHistoryId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx ?? this.prismaService;
    await prismaClient.loginHistory.update({
      where: { id: loginHistoryId },
      data: {
        success: true,
      },
    });
  }

  async updateLoginHistoryWithUserId(
    loginHistoryId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx ?? this.prismaService;
    await prismaClient.loginHistory.update({
      where: { id: loginHistoryId },
      data: {
        userId,
      },
    });
  }
}
