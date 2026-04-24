import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token sent to the user via email',
    example: 'abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
