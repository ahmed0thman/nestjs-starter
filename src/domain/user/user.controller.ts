import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { Request as REQ } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiSuccessResponse } from 'src/common/api-response/success.response';
import { User } from 'src/generated/prisma/client';

@Controller('user')
export class UserController {
  @UseGuards(JwtAuthGuard)
  @Get('profile')
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
