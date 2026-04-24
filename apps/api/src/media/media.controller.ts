import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MediaService } from './media.service';

class UploadUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  fileSize: number;

  @IsOptional()
  @IsString()
  folder?: string;
}

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get a pre-signed upload URL for S3/R2' })
  async getUploadUrl(@Body() dto: UploadUrlDto) {
    return this.mediaService.generateUploadUrl({
      fileName: dto.fileName,
      contentType: dto.contentType,
      fileSize: dto.fileSize,
      folder: dto.folder,
    });
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a media object from S3/R2' })
  async deleteMedia(@Param('key') key: string) {
    await this.mediaService.deleteObject(key);
  }
}
