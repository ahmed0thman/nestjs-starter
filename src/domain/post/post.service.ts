import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreatePostDTO } from './dto/create-post.dto';
import { postCreatedSelect, postFoundSelect } from './payload/post.payload';
import { RCreatedPost } from './responses/create-post.response';
import AppError from 'src/common/errors/app.error';
import { RPostFound } from './responses/post-found.response';

@Injectable()
export class PostService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly ycI18nService: YcI18nService,
  ) {}

  /**
   * Creates a new post
   * @param createPostDto
   * @param ownerId
   * @returns Promise<RCreatedPost>
   */
  async createPost(
    createPostDto: CreatePostDTO,
    ownerId: string,
  ): Promise<RCreatedPost> {
    return await this.prismaService.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        ownerId,
      },
      select: postCreatedSelect,
    });
  }

  async getPostById(postId: number): Promise<RPostFound> {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
      select: postFoundSelect,
    });
    if (!post)
      throw AppError.notFound(this.ycI18nService.t('messages.post.not_found'));
    return post;
  }
}
