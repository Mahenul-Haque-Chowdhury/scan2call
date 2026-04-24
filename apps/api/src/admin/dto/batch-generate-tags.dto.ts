import { IsInt, IsEnum, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TagType } from '@scan2call/shared';

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

  @ApiProperty({ example: 'Q2 2026 Pet Collar Batch' })
  @IsString()
  batchName: string;

  @ApiPropertyOptional({ example: 'Generated for distribution partner ABC' })
  @IsOptional()
  @IsString()
  notes?: string;
}
