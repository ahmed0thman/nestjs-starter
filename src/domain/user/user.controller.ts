import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { Request as REQ } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { type IResponse } from 'src/common/interceptors/response-transformer.interceptor';
import { User } from 'src/generated/prisma/client';

@Controller('user')
export class UserController {
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: REQ & { user: User }): IResponse<Partial<User>> {
    const data = req.user as User;
    return {
      message: 'This is a protected route' as string,
      data: data,
    };
  }
}
