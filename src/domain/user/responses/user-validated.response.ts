import { ApiProperty } from '@nestjs/swagger';
import { RUserFound } from './user-found.response';
import { authSecurity } from 'src/generated/prisma/client';

export class RUserValidated extends RUserFound {
  @ApiProperty({
    description: 'User hashed password',
    example: '$argon2id$v=19$m=65536,t=3,p=4$...',
  })
  password!: string;

  @ApiProperty({
    description: 'User account verification status',
    example: true,
  })
  verified!: boolean;

  @ApiProperty({
    description: 'User authentication security details',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      lockoutUntil: null,
      lastPasswordChange: '2024-01-01T00:00:00.000Z',
      mfaEnabled: false,
      mfaMethod: null,
    },
  })
  declare authSecurities: Pick<
    authSecurity,
    | 'id'
    | 'failedLoginAttempts'
    | 'lastFailedLogin'
    | 'lockoutUntil'
    | 'lastPasswordChange'
    | 'mfaEnabled'
    | 'mfaMethod'
  >;
}
