import { Controller, Get, Request } from '@nestjs/common';
import { Request as REQ } from 'express';
import { ApiSuccessResponse } from 'src/common/api-response/success.response';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { User } from 'src/generated/prisma/client';

@Controller('user')
export class UserController {
  @Get('profile')
  @CheckAbilities({
    action: 'read',
    subject: 'User',
  })
  getProfile(
    @Request() req: REQ & { user: User },
  ): ApiSuccessResponse<Partial<User>> {
    const data = req.user as User;
    return {
      message: 'This is a protected route' as string,
      data: data,
    };
  }
}
