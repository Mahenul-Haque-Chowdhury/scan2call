import { IsOptional, IsInt, Min, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGiftCodeDto {
  @ApiPropertyOptional({ example: 12, description: 'Duration in months (required if not lifetime)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  lifetime?: boolean;

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
