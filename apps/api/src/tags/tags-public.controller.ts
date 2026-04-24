import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { TagsService } from './tags.service';
import { ScansService } from '../scans/scans.service';
import { ReportFoundDto } from './dto/report-found.dto';
import { GenerateReportImageUploadUrlDto } from './dto/generate-report-image-upload-url.dto';

@ApiTags('scan')
@Controller('scan')
export class TagsPublicController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly scansService: ScansService,
  ) {}

  @Get(':token')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Public scan: get tag info by token (no owner PII)' })
  @ApiParam({ name: 'token', description: '12-char base62 tag token' })
  async scanTag(
    @Param('token') token: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // Record the scan
    await this.scansService.createScan(token, { ip, userAgent });

    // Return public tag info (no PII)
    const tagInfo = await this.tagsService.getPublicTagInfo(token);
    return { data: tagInfo };
  }

  @Post(':token/report-found')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Report a lost tag as found' })
  @ApiParam({ name: 'token', description: '12-char base62 tag token' })
  async reportFound(
    @Param('token') token: string,
    @Body() dto: ReportFoundDto,
    @Ip() ip: string,
  ) {
    const result = await this.tagsService.reportFound(token, dto, ip);
    return { data: result };
  }

  @Post(':token/report-image-upload-url')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Get a pre-signed URL for finder report image upload' })
  @ApiParam({ name: 'token', description: '12-char base62 tag token' })
  async getReportImageUploadUrl(
    @Param('token') token: string,
    @Body() dto: GenerateReportImageUploadUrlDto,
  ) {
    const result = await this.tagsService.generateReportImageUploadUrl(token, dto);
    return { data: result };
  }
}
