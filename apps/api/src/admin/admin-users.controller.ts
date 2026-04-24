import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (paginated, searchable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  async listUsers(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('role') role?: Role,
  ) {
    return this.adminService.listUsers({ page, pageSize, search, role });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by ID' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user (role, suspension)' })
  async updateUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() body: { role?: Role; isSuspended?: boolean; suspendedReason?: string },
  ) {
    return this.adminService.updateUser(admin.id, id, body);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Manually verify user email/phone' })
  async verifyUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() body: { emailVerified?: boolean; phoneVerified?: boolean },
  ) {
    return this.adminService.verifyUser(admin.id, id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a user (soft delete)' })
  async deleteUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteUser(admin.id, id);
  }
}
