import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignGiftCodeDto {
  @ApiProperty({ description: 'User ID to assign the gift code to' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Optional admin note' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
