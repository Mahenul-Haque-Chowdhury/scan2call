import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { GiftCodeStatus as PrismaGiftCodeStatus } from '@prisma/client';
import { Role } from '@scan2call/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { GiftService } from '../subscriptions/gift.service';
import { CreateGiftCodeDto } from './dto/create-gift-code.dto';
import { AssignGiftCodeDto } from './dto/assign-gift-code.dto';

@ApiTags('admin/gift-codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/gift-codes')
export class AdminGiftCodesController {
  constructor(private readonly giftService: GiftService) {}

  @Get()
  @ApiOperation({ summary: 'List subscription gift codes (paginated)' })
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
    return this.giftService.listGiftCodes({ page, pageSize, status, search });
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new subscription gift code' })
  async createGiftCode(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateGiftCodeDto,
  ) {
    return this.giftService.createGiftCode(admin.id, {
      durationMonths: dto.durationMonths,
      lifetime: dto.lifetime,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      maxRedemptions: dto.maxRedemptions,
    });
  }

  @Post(':id/assign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a gift code to a user (redeem on their behalf)' })
  async assignGiftCode(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignGiftCodeDto,
  ) {
    return this.giftService.assignGiftCode(admin.id, id, dto.userId, dto.note);
  }
}
