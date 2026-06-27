import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemGiftDto {
  @ApiProperty({ example: 'Scan2Call-Gift-AB12CD34' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  code: string;
}
