import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class DownloadQrAssetsDto {
  @ApiProperty({ description: 'Tag ids to download', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tagIds: string[];
}
