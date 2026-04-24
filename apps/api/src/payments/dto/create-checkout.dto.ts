import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CheckoutMode {
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
}

export class CreateCheckoutDto {
  @ApiProperty({ enum: CheckoutMode })
  @IsEnum(CheckoutMode)
  mode: CheckoutMode;

  @ApiPropertyOptional({ description: 'Order ID (for payment mode)' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Stripe price ID (for subscription mode)' })
  @IsOptional()
  @IsString()
  priceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
