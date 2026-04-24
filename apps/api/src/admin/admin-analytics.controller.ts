import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@scan2call/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@ApiTags('admin/analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get platform overview analytics' })
  async getOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('scans')
  @ApiOperation({ summary: 'Get scan analytics over a date range' })
  async getScans(@Query() query: AnalyticsQueryDto) {
    return this.adminService.getScansAnalytics(query);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics over a date range' })
  async getRevenue(@Query() query: AnalyticsQueryDto) {
    return this.adminService.getRevenueAnalytics(query);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get tag analytics (by status and type)' })
  async getTags() {
    return this.adminService.getTagsAnalytics();
  }
}
