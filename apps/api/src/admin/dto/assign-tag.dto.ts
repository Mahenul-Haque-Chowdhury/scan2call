import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TAG_MAX_DURATION_YEARS, TAG_MIN_DURATION_YEARS } from '@scan2call/shared';

export class AssignTagDto {
  @ApiProperty({ description: 'User ID to assign the tag to' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Tag ID to assign (preferred if known)' })
  @IsOptional()
  @IsString()
  tagId?: string;

  @ApiPropertyOptional({ description: 'Tag token (12-char base62)' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({
    description: 'QR duration in years (1-5). Defaults to 1.',
    minimum: TAG_MIN_DURATION_YEARS,
    maximum: TAG_MAX_DURATION_YEARS,
  })
  @IsOptional()
  @IsInt()
  @Min(TAG_MIN_DURATION_YEARS)
  @Max(TAG_MAX_DURATION_YEARS)
  durationYears?: number;
}
