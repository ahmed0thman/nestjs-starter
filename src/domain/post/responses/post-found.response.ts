import { ApiProperty } from '@nestjs/swagger';

export class RPostFound {
  @ApiProperty({
    description: 'Post UUID',
    example: 1001,
  })
  id!: number;
  @ApiProperty({
    description: 'Post title',
    example: 'My First Post',
  })
  title!: string;
  @ApiProperty({
    description: 'Post content',
    example: 'This is the content of my first post.',
  })
  content!: string;
  @ApiProperty({
    description: 'Post published status',
    example: true,
  })
  published!: boolean;
  @ApiProperty({
    description: 'Post published date',
    example: '2023-01-01T00:00:00.000Z',
  })
  publishedAt!: Date | null;
  @ApiProperty({
    description: 'Indicates if the post has been edited',
    example: false,
  })
  isEdited!: boolean;
  @ApiProperty({
    description: 'Post last updated date',
    example: '2023-01-02T00:00:00.000Z',
  })
  updatedAt!: Date;
  @ApiProperty({
    description: 'Indicates if the post has been deleted',
    example: false,
  })
  isDeleted!: boolean;
  @ApiProperty({
    description: 'Indicates if the post has been reported',
    example: false,
  })
  isReported!: boolean;
  @ApiProperty({
    description: 'Indicates if the post has been blocked',
    example: false,
  })
  isBlocked!: boolean;
  @ApiProperty({
    description: 'Post blocked date',
    example: null,
  })
  isBlockedAt?: Date | null;
  owner!: {
    id: string;
    firstName: string;
    lastName: string | null;
  };
  createdAt!: Date;
}
