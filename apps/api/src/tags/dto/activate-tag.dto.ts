import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class ActivateTagDto {
  @ApiProperty({ example: 'aB3kF9mN2xR7', description: '12-char base62 tag token' })
  @IsString()
  @Length(12, 12)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Token must be alphanumeric (base62)' })
  token: string;

  @ApiProperty({ example: 'My car keys', description: 'A name/label for this tag (required)' })
  @IsString()
  @IsNotEmpty({ message: 'Please provide a label for your tag (e.g. "My car keys", "Buddy\'s collar")' })
  @MaxLength(200)
  label: string;

  @ApiProperty({ required: false, example: 'Please call me if found! Reward offered.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostModeMessage?: string;
}
