import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SavedAddressDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  address1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address2?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  city: string;

  // State/province optional - many countries don't use states.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  // Postcode optional - some countries have no postal code system.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postcode?: string;

  @ApiPropertyOptional({ default: 'AU' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string = 'AU';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateSavedAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
