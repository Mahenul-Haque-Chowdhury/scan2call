import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Role } from '@scan2call/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin/orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listOrders(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.listOrders({ page, pageSize, status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async getOrder(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order (status, tracking, notes)' })
  async updateOrder(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: {
      status?: OrderStatus;
      trackingNumber?: string;
      trackingCarrier?: string;
      internalNotes?: string;
    },
  ) {
    return this.adminService.updateOrder(admin.id, id, body);
  }

  @Post(':id/refund')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Issue a full refund for an order' })
  async refundOrder(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.adminService.refundOrder(admin.id, id);
  }

  @Post(':orderId/items/:itemId/generate-tags')
  @ApiOperation({ summary: 'Generate tags for a specific order item' })
  async generateTags(
    @CurrentUser() admin: JwtPayload,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    const result = await this.adminService.generateTagsForOrderItem(admin.id, orderId, itemId);
    return { data: result };
  }
}
