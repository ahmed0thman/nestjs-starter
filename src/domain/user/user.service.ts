import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { User } from 'src/generated/prisma/client';
import { CreateUserDTO } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

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

  async createUser(createUserDto: CreateUserDTO): Promise<User['id']> {
    const { email, password, firstName, lastName, providerId } = createUserDto;
    const username = this.createRandomInitialUserName(firstName, lastName);
    const newUser = await this.prismaService.user.create({
      data: {
        email,
        password,
        firstName,
        lastName,
        username,
        providerId,
      },
    });
    return newUser.id;
  }
}
