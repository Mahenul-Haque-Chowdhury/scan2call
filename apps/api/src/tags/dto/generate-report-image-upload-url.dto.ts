import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class GenerateReportImageUploadUrlDto {
  @ApiProperty({ example: 'found-item.jpg' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType: string;

  @ApiProperty({ example: 342144, maximum: 5 * 1024 * 1024 })
  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  fileSize: number;
}
