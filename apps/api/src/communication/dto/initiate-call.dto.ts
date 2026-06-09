import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import { TOKEN_LENGTH } from '../../common/constants';

export class InitiateCallDto {
  @ApiProperty({ example: 'aB3kF9mN2xR7', description: '12-char base62 tag token' })
  @IsString()
  @Length(TOKEN_LENGTH, TOKEN_LENGTH)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Token must be alphanumeric (base62)' })
  token: string;
}
