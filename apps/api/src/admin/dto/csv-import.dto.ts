import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TagType } from '@prisma/client';

export class CsvImportDto {
  @ApiPropertyOptional({ enum: TagType, description: 'Tag type for all imported tags' })
  @IsOptional()
  @IsEnum(TagType)
  tagType?: TagType;

  @ApiPropertyOptional({ description: 'Name for this import batch' })
  @IsOptional()
  @IsString()
  batchName?: string;
}
