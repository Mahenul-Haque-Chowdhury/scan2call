import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @ApiProperty({ required: false, example: 'My dog Max' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiProperty({ required: false, example: 'Golden retriever, friendly' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false, example: 'https://cdn.scan2call.com/photos/abc.jpg' })
  @IsOptional()
  photoUrl?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowVoiceCall?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowSms?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowWhatsApp?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowSendLocation?: boolean;
}
