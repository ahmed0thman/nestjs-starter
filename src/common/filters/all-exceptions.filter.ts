/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpAdapterHost } from '@nestjs/core';
import { AppLoggerService } from '../modules/logger/logger.service';
import { env } from '../config/env/env';
import AppError from '../errors/app.error';
import { PrismaClientKnownRequestError } from 'src/generated/prisma/internal/prismaNamespace';
import { YcI18nService } from '../modules/yc-i18n/yc-i18n.service';
import { I18nPath } from 'src/i18n/i18n.generated';
import { ExceptionResponse } from '../api-response/exception.response';

const urlsToIgnore = [
  '/favicon.ico',
  '/.well-known/appspecific/com.chrome.devtools.json',
  // '/.well-known/assetlinks.json',
  // '/.well-known/security.txt',
  // '/.well-known/manifest.json',
  // '/.well-known/robots.txt',
  // '/.well-known/humans.txt',
  // '/.well-known/apple-app-site-association',
];

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly appLogger: AppLoggerService,
    private readonly YcI18nService: YcI18nService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const response = ctx.getResponse<Response>();

    // Ignore favicon requests - this is normal browser behavior
    if (urlsToIgnore.includes(request.url) && request.method === 'GET') {
      response.status(204).end();
      return;
    }

    const method = request.method;
    const url = request.url;
    const isProduction = env.NODE_ENV === 'production';

    let exceptionResponse: ExceptionResponse = {
      status: 'error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      message: this.YcI18nService.t('errors.INTERNAL_SERVER_ERROR'),
      error: 'Unknown error',
      isOperational: false,
      name: 'Error',
      stack: '',
      errors: undefined,
      code: '',
      url,
      method,
    };

    let appErrorMetaData: Record<string, any> = {};

    if (typeof exception === 'object' && exception !== null) {
      if ('statusCode' in exception && typeof exception.statusCode === 'number')
        exceptionResponse.statusCode = exception.statusCode;
      else if ('status' in exception && typeof exception.status === 'number')
        exceptionResponse.statusCode = exception.status;

      if ('message' in exception && typeof exception.message === 'string')
        exceptionResponse.message = exception.message;

      if ('name' in exception && typeof exception.name === 'string')
        exceptionResponse.name = exception.name;

      if (
        'isOperational' in exception &&
        typeof exception.isOperational === 'boolean'
      )
        exceptionResponse.isOperational = exception.isOperational;

      if ('stack' in exception && typeof exception.stack === 'string')
        exceptionResponse.stack = exception.stack;

      if ('error' in exception && typeof exception.error === 'string')
        exceptionResponse.error = exception.error;
      else if ('error' in exception && typeof exception.error === 'object')
        exceptionResponse.error = JSON.stringify(exception.error);
      else exceptionResponse.error = exceptionResponse.name || 'Error';

      if ('code' in exception && typeof exception.code === 'string')
        exceptionResponse.code = exception.code;
    }

    if (exception instanceof HttpException) {
      exceptionResponse.statusCode = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        if ('message' in response && typeof response.message === 'string')
          exceptionResponse.message = response.message;
        else if (
          'message' in response &&
          Array.isArray(response.message) &&
          response.message.every((msg) => typeof msg === 'string')
        )
          exceptionResponse.message = response.message.join(', ');
      }
    }

    if (exceptionResponse.code === 'ECONNREFUSED')
      exceptionResponse = this.handleConnectionRefusedError(exceptionResponse);

    if (exceptionResponse.code === 'P2002')
      exceptionResponse = this.handleUniqueConstraintError(
        exception,
        exceptionResponse,
      );

    if (exception.name === 'I18nValidationException' && 'errors' in exception) {
      exceptionResponse = this.handleI18nValidationException(
        exception,
        exceptionResponse,
      );
    }

    if (exception instanceof AppError) {
      exceptionResponse.statusCode = exception.statusCode;
      exceptionResponse.message = exception.message;
      exceptionResponse.errors = exception.errors;
      exceptionResponse.isOperational = exception.isOperational;
      appErrorMetaData = exception.appErrorMetaData;
      exceptionResponse.name = exception.name;
      exceptionResponse.stack = exception.stack || '';
    }

    // console.log('All Exception Filter catch: ', exception);

    exceptionResponse = {
      ...exceptionResponse,
      ...appErrorMetaData,
    };

    this.appLogger.logWithMetadata(
      'error',
      'Exception caught by AllExceptionsFilter',
      exceptionResponse,
    );

    let resObject: Record<string, any> = exceptionResponse;

    if (isProduction) {
      if (exceptionResponse.isOperational) {
        resObject = {
          statusCode: exceptionResponse.statusCode,
          timestamp: exceptionResponse.timestamp,
          message: exceptionResponse.message,
          fields: exceptionResponse.fields,
          errors: exceptionResponse.errors,
        };
      } else {
        resObject = {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp: new Date().toISOString(),
          message: this.YcI18nService.t('errors.INTERNAL_SERVER_ERROR'),
        };
      }
    }

    response.status(exceptionResponse.statusCode).json(resObject);
  }

  private handleI18nValidationException(
    exception: any,
    exceptionResponse: ExceptionResponse,
  ): ExceptionResponse {
    exceptionResponse.statusCode = HttpStatus.BAD_REQUEST;
    exceptionResponse.message = this.YcI18nService.t(
      'errors.validation_failed',
    );
    exceptionResponse.error = 'Validation_Failed';
    if (!('errors' in exception)) return exceptionResponse;
    const fileds: Record<string, any> = {};
    if (Array.isArray(exception.errors)) {
      exception.errors.forEach((error) => {
        if (typeof error === 'object' && error !== null) {
          const property = error.property || 'unknown';
          const constraints: Record<string, string> = error.constraints || {};
          fileds[property] =
            Object.values(constraints).length > 0
              ? Object.values(constraints)
                  .map((constrain) =>
                    this.YcI18nService.t(constrain as I18nPath),
                  )
                  .join(', ')
              : '';
        }
      });
    }
    exceptionResponse.fields = fileds;
    return exceptionResponse;
  }

  private handleConnectionRefusedError(
    exceptionResponse: ExceptionResponse,
  ): ExceptionResponse {
    exceptionResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    return {
      ...exceptionResponse,
      isOperational: false,
      message: this.YcI18nService.t('errors.DATABASE_CONNECTION_REFUSED'),
      error: 'Connection Refused',
    };
  }

  private handleUniqueConstraintError(
    exception: any,
    exceptionResponse: ExceptionResponse,
  ): ExceptionResponse {
    exceptionResponse.statusCode = HttpStatus.CONFLICT;
    let target;
    const fields: string[] | Record<string, any> = {};
    if (exception instanceof PrismaClientKnownRequestError) {
      target = exception.meta?.modelName || null;

      const driverAdapterError = exception.meta?.driverAdapterError as {
        cause?: {
          constraint?: {
            fields?: string[] | null;
          };
        };
      };
      if (
        driverAdapterError.cause?.constraint?.fields &&
        Array.isArray(driverAdapterError.cause?.constraint?.fields)
      ) {
        driverAdapterError.cause?.constraint?.fields.forEach((field) => {
          const fieldPath = `fields.${field}` as I18nPath;
          // check if fieldPath is a valid I18nPath

          if (fieldPath)
            fields[`${field}`] = this.YcI18nService.t(
              'errors.duplicate_value',
              {
                args: { field: this.YcI18nService.t(fieldPath) },
              },
            );
        });
      }
    }
    const message = this.YcI18nService.t('errors.make_sure_inputs_are_valid');
    return {
      ...exceptionResponse,
      isOperational: true,
      message,
      fields,
      error: `Unique Constraint Violation on ${target || 'unknown model'}`,
    };
  }
}
