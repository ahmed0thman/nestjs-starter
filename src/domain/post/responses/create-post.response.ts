import { ApiProperty } from '@nestjs/swagger';

export class RCreatedPost {
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
    description: 'post content',
    example: 'This is the content of my first post.',
  })
  content!: string;

  @ApiProperty({
    description: 'Post creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}
