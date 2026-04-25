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
import {
  ApiSuccessResponse,
  ApiSuccessResponseList,
} from '../api-response/success.response';

@Injectable()
export class ResponseTransformerInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T> | ApiSuccessResponseList<T>
> {
  constructor(private readonly logger: AppLoggerService) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T> | ApiSuccessResponseList<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data) => {
        // this.logger.logWithMetadata('info', 'Transforming response', { data });
        // clone data to avoid mutating the original response object
        const res = { ...data } as
          | ApiSuccessResponse<T>
          | ApiSuccessResponseList<T>;
        // check if it is a paginated response by looking for pagination metadata
        // if (
        //   data &&
        //   typeof data === 'object' &&
        //   'results' in data &&
        //   typeof data.results === 'number' &&
        //   data.results > 0 &&
        //   'data' in data &&
        //   Array.isArray(data.data) &&
        //   data.data.length > 0
        // ) {
        //   res = { ...data } as ApiSuccessResponseList<T>;
        // } else {
        //   res = { ...data } as ApiSuccessResponse<T>;
        // }
        return {
          ...res,
          status: 'success',
          statusCode: response.statusCode,
        } satisfies ApiSuccessResponse<T> | ApiSuccessResponseList<T>;
      }),
    );
  }
}
