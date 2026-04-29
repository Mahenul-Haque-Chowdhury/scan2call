import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactMessageReplyDto {
  @ApiPropertyOptional({ example: 'Scan2Call Support' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ example: 'Thanks for reaching out. We can help with that.' })
  @IsString()
  @MinLength(2)
  @MaxLength(5000)
  body: string;
}
