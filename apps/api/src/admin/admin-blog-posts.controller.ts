import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@scan2call/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/create-blog-post.dto';

@ApiTags('admin/blog-posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/blog-posts')
export class AdminBlogPostsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List blog posts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['published', 'draft'] })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  async listBlogPosts(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('status') status?: 'published' | 'draft',
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.adminService.listBlogPosts({
      page,
      pageSize,
      search,
      status,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog post details' })
  async getBlogPost(@Param('id') id: string) {
    return this.adminService.getBlogPostById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a blog post' })
  async createBlogPost(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateBlogPostDto,
  ) {
    return this.adminService.createBlogPost(admin.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a blog post' })
  async updateBlogPost(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
  ) {
    return this.adminService.updateBlogPost(admin.id, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a blog post' })
  async deleteBlogPost(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteBlogPost(admin.id, id);
  }
}
