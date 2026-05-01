import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SendLocationDto {
  @ApiProperty({ description: 'Tag token (9-char base62)' })
  @IsString()
  @Matches(/^[a-zA-Z0-9]{9}$/, { message: 'Token must be exactly 9 alphanumeric characters' })
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
