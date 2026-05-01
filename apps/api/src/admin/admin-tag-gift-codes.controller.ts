import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { GiftCodeStatus as PrismaGiftCodeStatus } from '@prisma/client';
import { Role } from '@scan2call/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { TagGiftService } from '../gifts/tag-gift.service';
import { CreateTagGiftCodeDto } from './dto/create-tag-gift-code.dto';
import { AssignGiftCodeDto } from './dto/assign-gift-code.dto';

@ApiTags('admin/tag-gift-codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/tag-gift-codes')
export class AdminTagGiftCodesController {
  constructor(private readonly tagGiftService: TagGiftService) {}

  @Get()
  @ApiOperation({ summary: 'List tag gift codes (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'REDEEMED', 'EXPIRED', 'REVOKED'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listGiftCodes(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: PrismaGiftCodeStatus,
    @Query('search') search?: string,
  ) {
    return this.tagGiftService.listTagGiftCodes({ page, pageSize, status, search });
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new tag gift code' })
  async createGiftCode(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateTagGiftCodeDto,
  ) {
    return this.tagGiftService.createTagGiftCode(admin.id, {
      tagType: dto.tagType,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      maxRedemptions: dto.maxRedemptions,
    });
  }

  @Post(':id/assign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a tag gift code to a user (redeem on their behalf)' })
  async assignGiftCode(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignGiftCodeDto,
  ) {
    return this.tagGiftService.assignTagGiftCode(admin.id, id, dto.userId, dto.note);
  }
}
