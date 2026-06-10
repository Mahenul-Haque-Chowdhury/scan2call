import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { TOKEN_LENGTH } from '../../common/constants';

export class SendLocationDto {
  @ApiProperty({ description: 'Tag token (12-char base62)' })
  @IsString()
  @Length(TOKEN_LENGTH, TOKEN_LENGTH)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Token must be alphanumeric (base62)' })
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

  @ApiProperty({ description: 'Cloudflare Turnstile verification token' })
  @IsString()
  captchaToken: string;
}
