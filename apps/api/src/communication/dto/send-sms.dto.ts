import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ example: 'aB3kF9mN2', description: '9-char base62 tag token' })
  @IsString()
  @Length(9, 9)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Token must be alphanumeric (base62)' })
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
}
