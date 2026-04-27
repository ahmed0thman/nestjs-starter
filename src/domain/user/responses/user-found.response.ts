import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/browser';
import { authSecurity } from 'src/generated/prisma/client';

export class RUserFound {
  @ApiProperty({
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;
  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email!: string;
  @ApiProperty({ description: 'User first name', example: 'John' })
  firstName!: string;
  @ApiProperty({ description: 'User last name', example: 'Doe' })
  lastName!: string;
  @ApiProperty({ description: 'Username', example: 'johndoe' })
  username!: string;
  @ApiProperty({ description: 'User account status', example: 'active' })
  status!: string;
  @ApiProperty({
    description: 'User role',
    example: { id: '1', name: 'admin' },
  })
  role!: Pick<Role, 'id' | 'name'>;

  authSecurities?: Pick<authSecurity, 'id' | 'lastPasswordChange'>;
}
