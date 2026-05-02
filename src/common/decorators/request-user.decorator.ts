// extract the user from the request and make it available in the route handler
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RUserFound } from 'src/domain/user/responses/user-found.response';

export const RequestUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as RUserFound;
  },
);
