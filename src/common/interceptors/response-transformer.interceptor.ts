import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppLoggerService } from '../modules/logger/logger.service';

export interface IResponse<T> {
  message: string | string[];
  results?: number;
  data?: T;
  meta?: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface IResponseFull<T> extends IResponse<T> {
  status: 'success';
  statusCode: number;
}

@Injectable()
export class ResponseTransformerInterceptor<T> implements NestInterceptor<
  T,
  IResponseFull<T>
> {
  constructor(private readonly logger: AppLoggerService) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IResponseFull<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data) => {
        this.logger.logWithMetadata('info', 'Transforming response', { data });
        // clone data to avoid mutating the original response object
        const res = { ...data } as IResponse<T>;

        return {
          ...res,
          status: 'success',
          statusCode: response.statusCode,
        } satisfies IResponseFull<T>;
      }),
    );
  }
}
