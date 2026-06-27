import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TagType as PrismaTagType } from '@prisma/client';
import { TagType } from '@scan2call/shared';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'URL-friendly slug (lowercase, dashes only)' })
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug must be lowercase with dashes' })
  slug: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty({ description: 'Per-year (QR yearly) price in AUD cents' })
  @IsInt()
  @Min(0)
  priceInCents: number;

  @ApiPropertyOptional({ description: 'Compare-at price in AUD cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({
    description: 'Find My device flat price (AUD cents), includes year 1. Required when hasFindMy.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  devicePriceInCents?: number;

  @ApiPropertyOptional({
    description: 'Whether this product is a Find My device (Pet Collar, Keychain)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasFindMy?: boolean;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ enum: TagType })
  @IsOptional()
  @IsEnum(TagType)
  tagType?: PrismaTagType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  includesTagCount?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'Stripe product ID (prod_...)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  stripeProductId?: string | null;

  @ApiPropertyOptional({ description: 'Stripe price ID (price_...)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  stripePriceId?: string | null;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug must be lowercase with dashes' })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Per-year (QR yearly) price in AUD cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceInCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ description: 'Find My device flat price (AUD cents), includes year 1' })
  @IsOptional()
  @IsInt()
  @Min(0)
  devicePriceInCents?: number;

  @ApiPropertyOptional({ description: 'Whether this product is a Find My device' })
  @IsOptional()
  @IsBoolean()
  hasFindMy?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isInStock?: boolean;

  @ApiPropertyOptional({ enum: TagType })
  @IsOptional()
  @IsEnum(TagType)
  tagType?: PrismaTagType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  includesTagCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'Stripe product ID (prod_...)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  stripeProductId?: string | null;

  @ApiPropertyOptional({ description: 'Stripe price ID (price_...)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  stripePriceId?: string | null;
}
