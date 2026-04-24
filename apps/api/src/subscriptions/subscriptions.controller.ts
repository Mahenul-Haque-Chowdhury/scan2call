import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plan')
  @ApiOperation({ summary: 'Get subscription plan info (public)' })
  getPlan() {
    return this.subscriptionsService.getPlanInfo();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  async getMySubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create subscription via Stripe Checkout' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createCheckoutSession(user.id, dto);
  }

  @Post('me/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  async cancel(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.cancelSubscription(user.id);
  }

  @Post('me/resume')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume a cancelling subscription' })
  async resume(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.resumeSubscription(user.id);
  }

  @Post('billing-portal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Stripe Billing Portal URL' })
  async billingPortal(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.createBillingPortalSession(user.id);
  }
}
