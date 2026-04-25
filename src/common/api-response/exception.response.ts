import { ApiProperty } from '@nestjs/swagger';

export class ExceptionResponse {
  @ApiProperty({
    description: 'Response status',
    example: 'error',
  })
  status!: 'error';
  @ApiProperty({
    description: 'HTTP status code',
    example: 500,
  })
  statusCode!: number;
  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2023-01-01T00:00:00.000Z',
  })
  timestamp!: string;
  @ApiProperty({
    description: 'Error message',
    example: 'Internal server error',
  })
  message!: string;
  @ApiProperty({
    description: 'Error name',
    example: 'Error',
  })
  error!: string;
  @ApiProperty({
    description: 'Error fields',
    example: ['email', 'password'],
  })
  fields?: string | string[] | Record<string, any>;
  @ApiProperty({
    description: 'Detailed errors',
    example: { email: 'Email is required' },
  })
  errors?: unknown;
  @ApiProperty({
    description: 'Indicates if the error is operational',
    example: false,
  })
  isOperational!: boolean;
  @ApiProperty({
    description: 'Error name',
    example: 'Error',
  })
  name!: string;
  @ApiProperty({
    description: 'Error stack trace',
    example: 'Error: Internal server error\n    at ...',
  })
  stack?: string;
  @ApiProperty({
    description: 'Error code',
    example: 'INTERNAL_SERVER_ERROR',
  })
  code?: string;
  @ApiProperty({
    description: 'Request URL',
    example: 'http://localhost:3000/api/users',
  })
  url!: string;
  @ApiProperty({
    description: 'Request method',
    example: 'POST',
  })
  method!: string;
  [key: string]: any; // Allow additional properties
}
