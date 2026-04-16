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

interface ExceptionResponse {
  statusCode: number;
  timestamp: string;
  message: string;
  error: string;
  fields?: string | string[] | Record<string, any>;
  errors?: unknown;
  isOperational: boolean;
  name: string;
  stack?: string;
  code?: string;
  url: string;
  method: string;
  [key: string]: any; // Allow additional properties
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly appLogger: AppLoggerService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const response = ctx.getResponse<Response>();

    // Ignore favicon requests - this is normal browser behavior
    if (request.url === '/favicon.ico') {
      response.status(204).end();
      return;
    }

    const method = request.method;
    const url = request.url;
    const isProduction = env.NODE_ENV === 'production';

    let exceptionResponse: ExceptionResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      message: 'Internal server error',
      error: 'Unknown error',
      isOperational: false,
      name: 'Error',
      stack: '',
      errors: undefined,
      code: '',
      url,
      method,
    };

    let appErrorMetaData: Record<string, any>[] = [];

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
        'isOptional' in exception &&
        typeof exception.isOptional === 'boolean'
      )
        exceptionResponse.isOperational = exception.isOptional;

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
          errors: exceptionResponse.errors,
          fields: exceptionResponse.fields,
        };
      } else {
        resObject = {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp: new Date().toISOString(),
          message: 'An unexpected error occurred',
        };
      }
    }

    response.status(exceptionResponse.statusCode).json(resObject);
  }

  private handleConnectionRefusedError(
    exceptionResponse: ExceptionResponse,
  ): ExceptionResponse {
    return {
      ...exceptionResponse,
      isOperational: false,
      message:
        'Database connection refused. Please check your database server.',
      error: 'Connection Refused',
    };
  }

  private handleUniqueConstraintError(
    exception: any,
    exceptionResponse: ExceptionResponse,
  ): ExceptionResponse {
    let target;
    let fields: string[] | undefined;
    if (exception instanceof PrismaClientKnownRequestError) {
      target = exception.meta?.modelName || null;

      const driverAdapterError = exception.meta?.driverAdapterError as {
        cause?: {
          constraint?: {
            fields?: string[] | null;
          };
        };
      };
      fields = driverAdapterError.cause?.constraint?.fields || undefined;
    }
    const message = target
      ? `Unique constraint failed on model ${target}`
      : 'Unique constraint violation occurred.';
    return {
      ...exceptionResponse,
      isOperational: true,
      message,
      fields,
      error: 'Unique Constraint Violation',
    };
  }
}
