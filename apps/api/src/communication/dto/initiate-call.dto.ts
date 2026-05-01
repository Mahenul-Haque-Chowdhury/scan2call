import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class InitiateCallDto {
  @ApiProperty({ example: 'aB3kF9mN2', description: '9-char base62 tag token' })
  @IsString()
  @Length(9, 9)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Token must be alphanumeric (base62)' })
  token: string;
}
