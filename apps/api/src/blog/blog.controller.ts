import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { BlogService } from './blog.service';
import { BlogPostQueryDto } from './dto/blog-post-query.dto';

@ApiTags('blog')
@Controller('blog-posts')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published blog posts' })
  async findAll(@Query() query: BlogPostQueryDto) {
    return this.blogService.findAll(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'List featured blog posts' })
  async findFeatured() {
    return this.blogService.findFeatured();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get published blog post by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return {
      data: await this.blogService.findBySlug(slug),
    };
  }
}
