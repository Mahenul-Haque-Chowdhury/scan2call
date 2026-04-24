import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class ReportFoundDto {
  @ApiProperty({ required: false, example: 'I found this near the park gate.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiProperty({ required: false, example: 'https://cdn.scan2call.com/finder-reports/abc123/photo.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  finderImageUrl?: string;

  @ApiProperty({ example: '0.xxxxxxxxxxxxxxxxxxxxx' })
  @IsString()
  @MaxLength(4096)
  captchaToken: string;
}
