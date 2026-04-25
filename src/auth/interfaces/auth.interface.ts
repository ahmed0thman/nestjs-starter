import { ApiProperty } from '@nestjs/swagger';
import { type Role } from 'src/generated/prisma/client';
import { userStatus } from 'src/generated/prisma/enums';

export class IUserPayload {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  sub!: string;
  @ApiProperty({
    description: 'JWT ID, a unique identifier for the token',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  jti?: string; // JWT ID, a unique identifier for the token, optional as we use it only for refresh tokens
  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  email!: string;
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName!: string;
  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName?: string | null;
  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  username!: string;
  @ApiProperty({
    description: 'User role',
    example: 'USER',
  })
  role!: Role;
  @ApiProperty({
    description: 'User status',
    example: 'ACTIVE',
  })
  status!: userStatus;
}

export class ITokensPayload {
  @ApiProperty({
    description: 'Access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjI0MDAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken!: string;
  @ApiProperty({
    description: 'Refresh token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjI0MDAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  refreshToken!: string;
}

export class IAuthUser {
  @ApiProperty({
    description: 'Authenticated user',
  })
  user!: IUserPayload;
  @ApiProperty({
    description: 'Authentication tokens',
  })
  token!: ITokensPayload;
}
