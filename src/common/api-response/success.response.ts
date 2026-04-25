import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponse<T = any> {
  @ApiProperty({
    description: 'Response status',
    example: 'success',
  })
  status?: 'success';
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode?: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation successful',
  })
  message!: string;
  @ApiProperty({
    description: 'Response data',
  })
  data?: T;
}

export class ApiSuccessResponseList<T = any> extends ApiSuccessResponse<T[]> {
  @ApiProperty({
    description: 'Number of results returned',
    example: 1,
  })
  results!: number;
  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      pageSize: 10,
      totalPages: 5,
      hasPreviousPage: false,
      hasNextPage: true,
    },
  })
  meta!: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}
