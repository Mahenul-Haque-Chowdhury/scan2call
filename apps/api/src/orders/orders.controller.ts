import { Controller, Post, Get, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { PhoneVerifiedGuard } from '../common/guards';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(PhoneVerifiedGuard)
  @Post('checkout/session')
  @ApiOperation({ summary: 'Create Stripe Checkout session for order (subscriber only)' })
  async createCheckoutSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createCheckoutSession(user.id, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List current user orders' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.findAllForUser(user.id, query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order detail' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOneForUser(user.id, id);
  }
}
