import { IsOptional, IsInt, Min, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TagType } from '@scan2call/shared';

export class CreateTagGiftCodeDto {
  @ApiPropertyOptional({ enum: TagType, example: 'GENERIC' })
  @IsOptional()
  @IsEnum(TagType)
  tagType?: TagType;

  @ApiPropertyOptional({ example: '2030-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 1, description: 'Max redemptions per code' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;
}
