import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiPropertyOptional({ description: 'URL to redirect to on success (overrides default)' })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ description: 'URL to redirect to on cancel (overrides default)' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
