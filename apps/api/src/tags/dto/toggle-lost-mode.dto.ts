import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ToggleLostModeDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isLostMode: boolean;

  @ApiProperty({ required: false, example: 'Please call me if found! Reward offered.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostModeMessage?: string | null;
}
