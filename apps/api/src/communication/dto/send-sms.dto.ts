import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { TOKEN_LENGTH } from '../../common/constants';

export class SendSmsDto {
  @ApiProperty({ example: 'aB3kF9mN2xR7', description: '12-char base62 tag token' })
  @IsString()
  @Length(TOKEN_LENGTH, TOKEN_LENGTH)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Token must be alphanumeric (base62)' })
  token: string;

  @ApiProperty({
    required: false,
    example: 'Hi, I found your item!',
    description: 'Message from the finder to the owner',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiProperty({ description: 'Cloudflare Turnstile verification token' })
  @IsString()
  captchaToken: string;
}
