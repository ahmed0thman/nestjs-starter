import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { CreatePostDTO } from './dto/create-post.dto';
import { PostService } from './post.service';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { RUserFound } from '../user/responses/user-found.response';
import { RCreatedPost } from './responses/create-post.response';
import { ApiSuccessResponseDecorator } from 'src/common/decorators/api-response.decorators';
import { ApiOperation } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { ApiSuccessResponse } from 'src/common/api-response/success.response';
import { RPostFound } from './responses/post-found.response';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly logger: AppLoggerService,
    private readonly ycI18nService: YcI18nService,
  ) {}

  /**
   * Creates a new post
   * @param createPostDto
   * @param user
   * @returns ApiSuccessResponse<RCreatedPost>
   */
  @ApiOperation({ summary: 'Create a new post' })
  @ApiSuccessResponseDecorator(201, 'Post created successfully', RCreatedPost)
  @Post()
  @CheckAbilities({ action: 'create', subject: 'Post' })
  async createPost(
    @Body() createPostDto: CreatePostDTO,
    @RequestUser() user: RUserFound,
  ): Promise<ApiSuccessResponse<RCreatedPost>> {
    const post = await this.postService.createPost(createPostDto, user.id);
    return {
      message: this.ycI18nService.t('messages.post.created'),
      data: post,
    };
  }

  @ApiOperation({
    summary: 'Get a post by ID (only for the owner)',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'ID of the post to retrieve',
      },
    ],
  })
  @ApiSuccessResponseDecorator(200, 'Post retrieved successfully', RPostFound)
  @Get(':id')
  @CheckAbilities({ action: 'read', subject: 'Post' })
  async getPostById(@Param() { id }): Promise<ApiSuccessResponse<RPostFound>> {
    const postId = parseInt(id, 10);
    const post = await this.postService.getPostById(postId);
    return {
      message: this.ycI18nService.t('messages.success'),
      data: post,
    };
  }
}
