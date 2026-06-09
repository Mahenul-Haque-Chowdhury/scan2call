import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SubscriptionPlanId } from '@scan2call/shared';

export class CreateSubscriptionDto {
  @ApiProperty({
    enum: ['monthly', 'yearly', 'three_year'],
    description: 'Subscription plan to purchase',
  })
  @IsString()
  @IsIn(['monthly', 'yearly', 'three_year'])
  planId: SubscriptionPlanId;

  @ApiPropertyOptional({ description: 'URL to redirect to on success (overrides default)' })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ description: 'URL to redirect to on cancel (overrides default)' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
