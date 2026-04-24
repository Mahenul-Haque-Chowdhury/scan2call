import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SendLocationDto {
  @ApiProperty({ description: 'Tag token (12-char base62)' })
  @IsString()
  @Matches(/^[a-zA-Z0-9]{12}$/, { message: 'Token must be exactly 12 alphanumeric characters' })
  token: string;

  @ApiProperty({ description: 'Finder latitude' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Finder longitude' })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Optional message from finder' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
