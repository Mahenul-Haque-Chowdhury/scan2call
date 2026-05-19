import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReserveTagGiftCodeDto {
  @ApiProperty({ description: 'Scanned 12-character tag token', example: 'Ab12Cd34Ef56' })
  @IsString()
  @Matches(/^[A-Za-z0-9]{12}$/)
  tagToken: string;

  @ApiPropertyOptional({ description: 'Optional admin note' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}