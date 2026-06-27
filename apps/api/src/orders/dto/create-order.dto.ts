import {
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TAG_MAX_DURATION_YEARS, TAG_MIN_DURATION_YEARS } from '@scan2call/shared';

export class CartItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'QR duration in years (1-5)',
    minimum: TAG_MIN_DURATION_YEARS,
    maximum: TAG_MAX_DURATION_YEARS,
    default: TAG_MIN_DURATION_YEARS,
  })
  @IsInt()
  @Min(TAG_MIN_DURATION_YEARS)
  @Max(TAG_MAX_DURATION_YEARS)
  durationYears: number;

  @ApiPropertyOptional({
    description: 'Auto-renew the QR before it expires (charges the saved card)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ description: 'Custom label for the tag' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagLabel?: string;

  @ApiPropertyOptional({ description: 'Custom description for the tag' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  tagDescription?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiProperty()
  @IsString()
  shippingFirstName: string;

  @ApiProperty()
  @IsString()
  shippingLastName: string;

  @ApiProperty()
  @IsString()
  shippingAddress1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddress2?: string;

  @ApiProperty()
  @IsString()
  shippingCity: string;

  @ApiProperty()
  @IsString()
  shippingState: string;

  @ApiProperty()
  @IsString()
  shippingPostcode: string;

  @ApiProperty({ default: 'AU' })
  @IsOptional()
  @IsString()
  shippingCountry?: string = 'AU';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerNotes?: string;
}
