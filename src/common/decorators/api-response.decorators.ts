import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import {
  ApiSuccessResponse,
  ApiSuccessResponseList,
} from '../api-response/success.response';
import { ExceptionResponse } from '../api-response/exception.response';

export const ApiSuccessResponseDecorator = <TModel extends Type<any>>(
  status: number = 200,
  description: string = 'Successful response',
  dataType?: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(ApiSuccessResponse, dataType || Object),
    ApiResponse({
      status,
      description,
      schema: dataType
        ? {
            allOf: [
              { $ref: getSchemaPath(ApiSuccessResponse) },
              {
                properties: {
                  data: {
                    $ref: getSchemaPath(dataType),
                  },
                },
              },
            ],
          }
        : {
            allOf: [
              { $ref: getSchemaPath(ApiSuccessResponse) },
              {
                properties: {
                  data: {
                    type: 'object',
                  },
                },
              },
            ],
          },
    }),
  );
};

export const ApiSuccessArrayResponseDecorator = <TModel extends Type<any>>(
  status: number = 200,
  description: string = 'Successful response',
  dataType: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(ApiSuccessResponseList, dataType),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessResponseList) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(dataType) },
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Decorator for common error responses
 * Automatically adds standard error response documentation
 */
export const ApiCommonErrorResponses = () => {
  return applyDecorators(
    ApiExtraModels(ExceptionResponse),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
      schema: { $ref: getSchemaPath(ExceptionResponse) },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Authentication required',
      schema: { $ref: getSchemaPath(ExceptionResponse) },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      schema: { $ref: getSchemaPath(ExceptionResponse) },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Resource not found',
      schema: { $ref: getSchemaPath(ExceptionResponse) },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error - Something went wrong',
      schema: { $ref: getSchemaPath(ExceptionResponse) },
    }),
  );
};

/**
 * Comprehensive decorator combining success and error responses
 * Use this for most endpoints
 *
 * @example
 * @ApiResponseDecorator(200, 'User created successfully', UserEntity)
 * @Post()
 * create(@Body() createUserDto: CreateUserDto) {
 *   return this.userService.create(createUserDto);
 * }
 */
export const ApiResponseDecorator = <TModel extends Type<any>>(
  status: number = 200,
  description: string = 'Successful response',
  dataType?: TModel,
) => {
  return applyDecorators(
    ApiSuccessResponseDecorator(status, description, dataType),
    ApiCommonErrorResponses(),
  );
};

/**
 * Comprehensive decorator for array responses
 */
export const ApiArrayResponseDecorator = <TModel extends Type<any>>(
  status: number = 200,
  description: string = 'Successful response',
  dataType: TModel,
) => {
  return applyDecorators(
    ApiSuccessArrayResponseDecorator(status, description, dataType),
    ApiCommonErrorResponses(),
  );
};
