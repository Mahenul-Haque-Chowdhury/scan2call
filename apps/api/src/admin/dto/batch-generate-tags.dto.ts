import { IsInt, IsEnum, IsString, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TagType, TAG_MAX_DURATION_YEARS, TAG_MIN_DURATION_YEARS } from '@scan2call/shared';
import { QrFrameStyle } from '../../qr-code/qr-frame-style';
import { QrLayout, QR_LAYOUT_VALUES } from '../../qr-code/qr-layout';

export class BatchGenerateTagsDto {
  @ApiProperty({ example: 50, description: 'Number of tags to generate (1-10000)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity: number;

  @ApiProperty({ enum: TagType, example: 'PET_COLLAR' })
  @IsEnum(TagType)
  tagType: TagType;

  @ApiPropertyOptional({ example: 'Q2 2026 Pet Collar Batch' })
  @IsOptional()
  @IsString()
  batchName?: string;

  @ApiPropertyOptional({ example: 'Generated for distribution partner ABC' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'QR period (years) bundled with this retail batch, applied when a tag is claimed. Defaults to 1.',
    minimum: TAG_MIN_DURATION_YEARS,
    maximum: TAG_MAX_DURATION_YEARS,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(TAG_MIN_DURATION_YEARS)
  @Max(TAG_MAX_DURATION_YEARS)
  bundledDurationYears?: number;

  @ApiPropertyOptional({ description: 'Store PNG and SVG QR assets in R2/S3' })
  @IsOptional()
  @IsBoolean()
  storeQrAssets?: boolean;

  @ApiPropertyOptional({ description: 'QR frame style for this batch', enum: Object.values(QrFrameStyle) })
  @IsOptional()
  @IsEnum(QrFrameStyle)
  qrFrameStyle?: QrFrameStyle;

  @ApiPropertyOptional({ description: 'QR physical layout for this batch', enum: QR_LAYOUT_VALUES })
  @IsOptional()
  @IsEnum(QrLayout)
  qrLayout?: QrLayout;
}
