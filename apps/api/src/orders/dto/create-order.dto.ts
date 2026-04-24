import { IsArray, ValidateNested, IsString, IsInt, Min, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

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
