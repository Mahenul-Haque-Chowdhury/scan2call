import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { ContactMessageStatus as PrismaContactMessageStatus } from '@prisma/client';
import { Role } from '@scan2call/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { ContactMessageReplyDto } from './dto/contact-message-reply.dto';

@ApiTags('admin/contact-messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/contact-messages')
export class AdminContactMessagesController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List contact form messages (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['NEW', 'REPLIED', 'ARCHIVED'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listMessages(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: PrismaContactMessageStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.listContactMessages({ page, pageSize, status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single contact message and replies' })
  async getMessage(@Param('id') id: string) {
    return this.adminService.getContactMessageById(id);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a contact message' })
  async replyToMessage(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() body: ContactMessageReplyDto,
  ) {
    return this.adminService.replyContactMessage(admin.id, id, body);
  }
}
