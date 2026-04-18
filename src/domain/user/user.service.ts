import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateUserDTO } from './dto/create-user.dto';
import AppError from 'src/common/errors/app.error';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { env } from 'src/common/config/env/env';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ycI18nService: YcI18nService,
  ) {}

  private createRandomInitialUserName(
    firstname: string,
    lastname?: string,
  ): string {
    // generate random 4 letter prefix
    const prefix = Math.random().toString(36).substring(2, 6);
    // generate random 4 letter suffix
    const suffix = Math.random().toString(36).substring(2, 6);
    // generate random separator from [_,-,:,$,%,.,=,~]
    const separators = ['_', '-', ':', '$', '%', '.', '=', '~'];
    const separatorPrefix =
      separators[Math.floor(Math.random() * separators.length)];
    const separatorSuffix =
      separators[Math.floor(Math.random() * separators.length)];
    // combine them to create the username
    return `${prefix}${separatorPrefix}${firstname}${lastname ? separatorSuffix + lastname : ''}${separatorSuffix}${suffix}`;
  }

  private async verifyPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return await argon2.verify(hashedPassword, plainPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  async findUserById(id: string) {
    return await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        status: true,
        verified: true,
        authSecurities: {
          select: {
            lastPasswordChange: true,
          },
        },
      },
    });
  }

  async validateUser(email: string, password: string) {
    if (!email)
      throw AppError.badRequest(
        this.ycI18nService.t('errors.invalid_credentials'),
      );
    const user = await this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        password: true,
        role: true,
        status: true,
        verified: true,
        authSecurities: {
          select: {
            id: true,
            failedLoginAttempts: true,
            lastFailedLogin: true,
            lockoutUntil: true,
            lastPasswordChange: true,
            mfaEnabled: true,
            mfaMethod: true,
          },
        },
      },
    });

    // if user not found, use fake hash to prevent timing attacks
    if (!user) {
      await argon2.verify(env.FAKE_HASHED_PASSWORD, password);
      throw AppError.unauthorized(
        this.ycI18nService.t('errors.invalid_credentials'),
      );
    }

    if (user && (await this.verifyPassword(user.password, password))) {
      return user;
    }

    throw AppError.unauthorized(
      this.ycI18nService.t('errors.invalid_credentials'),
    );
  }

  // return selected fields id, email, firstName, lastName, username
  async createUser(createUserDto: CreateUserDTO) {
    const { email, password, firstName, lastName, providerId } = createUserDto;
    const username = this.createRandomInitialUserName(firstName, lastName);
    const newUser = await this.prismaService.user.create({
      data: {
        email,
        password: await this.hashPassword(password),
        firstName,
        lastName,
        username,
        providerId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    });
    return newUser;
  }
}
