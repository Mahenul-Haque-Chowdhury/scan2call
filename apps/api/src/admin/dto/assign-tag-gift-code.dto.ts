import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignTagGiftCodeDto {
  @ApiProperty({ description: 'User ID to assign / redeem the tag gift for' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Optional admin note' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
