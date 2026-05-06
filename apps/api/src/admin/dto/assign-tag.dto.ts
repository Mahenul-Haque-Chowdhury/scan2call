import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AssignTagDto {
  @ApiProperty({ description: 'User ID to assign the tag to' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Tag ID to assign (preferred if known)' })
  @IsOptional()
  @IsString()
  tagId?: string;

  @ApiPropertyOptional({ description: 'Tag token (12-char base62)' })
  @IsOptional()
  @IsString()
  token?: string;
}
