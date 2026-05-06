import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { TagStatus as PrismaTagStatus, TagType as PrismaTagType } from '@prisma/client';
import { Role, TagStatus, TagType } from '@scan2call/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { BatchGenerateTagsDto } from './dto/batch-generate-tags.dto';
import { CsvImportDto } from './dto/csv-import.dto';
import { AssignTagDto } from './dto/assign-tag.dto';
import { QrCodeService } from '../qr-code/qr-code.service';
import { DEFAULT_QR_FRAME_STYLE, QrFrameStyle } from '../qr-code/qr-frame-style';
import { DownloadQrAssetsDto } from './dto/download-qr-assets.dto';
import archiver from 'archiver';

@ApiTags('admin/tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/tags')
export class AdminTagsController {
  constructor(
    private readonly adminService: AdminService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all tags (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TagStatus })
  @ApiQuery({ name: 'type', required: false, enum: TagType })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listTags(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: PrismaTagStatus,
    @Query('type') type?: PrismaTagType,
    @Query('search') search?: string,
  ) {
    return this.adminService.listTags({ page, pageSize, status, type, search });
  }

  @Post('assign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a tag to a user (activates immediately)' })
  async assignTag(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: AssignTagDto,
  ) {
    return this.adminService.assignTagToUser(admin.id, dto);
  }

  @Post('generate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Batch generate tags with unique tokens' })
  async batchGenerate(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: BatchGenerateTagsDto,
  ) {
    return this.adminService.batchGenerateTags(admin.id, dto);
  }

  @Post('import')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        tagType: { type: 'string', enum: Object.values(TagType) },
        batchName: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Import tags from CSV file' })
  async importCsv(
    @CurrentUser() admin: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CsvImportDto,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are accepted');
    }

    const csvContent = file.buffer.toString('utf-8');
    return this.adminService.importTagsCsv(admin.id, csvContent, dto.batchName, dto.tagType);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List all tag batches' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async listBatches(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.adminService.listBatches({ page, pageSize });
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get tag batch details' })
  async getBatch(@Param('id') id: string) {
    return this.adminService.getBatchById(id);
  }

  @Post('qr-assets/download')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Download QR assets for selected tags' })
  async downloadQrAssets(
    @Body() dto: DownloadQrAssetsDto,
    @Res() res: Response,
  ) {
    const result = await this.adminService.getQrAssetsForTagIds(dto.tagIds);
    const zipName = `scan2call-qr-assets-${Date.now()}.zip`;

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: Error) => {
      res.status(500).send({ message: err.message });
    });
    archive.pipe(res);

    for (const item of result.data) {
      const scanUrl = this.qrCodeService.buildScanUrl(item.token);
      const [png, svg] = await Promise.all([
        this.qrCodeService.generatePngWithOptions(scanUrl, item.renderOptions),
        this.qrCodeService.generateSvgWithOptions(scanUrl, item.renderOptions),
      ]);
      archive.append(png, { name: `${item.token}.png` });
      archive.append(Buffer.from(svg, 'utf-8'), { name: `${item.token}.svg` });
    }

    await archive.finalize();
  }

  @Post('batches/:id/qr-assets/regenerate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Regenerate QR assets for a batch' })
  async regenerateBatchQrAssets(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.adminService.regenerateBatchQrAssets(admin.id, id);
  }

  @Post('batches/:id/qr-assets/download')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Download QR assets for a batch' })
  async downloadBatchQrAssets(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.adminService.getQrAssetsForBatch(id);
    const safeName = result.batchName.replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
    const zipName = `scan2call-batch-${safeName || id}.zip`;

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: Error) => {
      res.status(500).send({ message: err.message });
    });
    archive.pipe(res);

    for (const item of result.data) {
      const scanUrl = this.qrCodeService.buildScanUrl(item.token);
      const [png, svg] = await Promise.all([
        this.qrCodeService.generatePngWithOptions(scanUrl, item.renderOptions),
        this.qrCodeService.generateSvgWithOptions(scanUrl, item.renderOptions),
      ]);
      archive.append(png, { name: `${item.token}.png` });
      archive.append(Buffer.from(svg, 'utf-8'), { name: `${item.token}.svg` });
    }

    await archive.finalize();
  }

  @Get('qr-frame/preview')
  @ApiOperation({ summary: 'Preview a QR frame style' })
  @ApiQuery({ name: 'format', required: false, enum: ['png', 'svg'] })
  @ApiQuery({ name: 'frameStyle', required: false, enum: Object.values(QrFrameStyle) })
  async previewQrFrame(
    @Query('format') format: string = 'svg',
    @Query('frameStyle') frameStyle?: QrFrameStyle,
    @Res() res: Response,
  ) {
    if (frameStyle && !Object.values(QrFrameStyle).includes(frameStyle)) {
      throw new BadRequestException('Invalid QR frame style');
    }
    const resolvedFrameStyle = frameStyle ?? DEFAULT_QR_FRAME_STYLE;
    const scanUrl = this.qrCodeService.buildScanUrl('SAMPLE123456');

    if (format === 'png') {
      const png = await this.qrCodeService.generatePngWithOptions(scanUrl, {
        frameStyle: resolvedFrameStyle,
      });
      res.set('Content-Type', 'image/png');
      res.send(png);
    } else {
      const svg = await this.qrCodeService.generateSvgWithOptions(scanUrl, {
        frameStyle: resolvedFrameStyle,
      });
      res.set('Content-Type', 'image/svg+xml');
      res.send(svg);
    }
  }

  @Get(':tagId/qr-code')
  @ApiOperation({ summary: 'Download QR code for a tag' })
  @ApiQuery({ name: 'format', required: false, enum: ['png', 'svg'] })
  @ApiQuery({ name: 'size', required: false, type: Number })
  async getQrCode(
    @Param('tagId') tagId: string,
    @Query('format') format: string = 'png',
    @Query('size') size: string = '300',
    @Res() res: Response,
  ) {
    const tag = await this.adminService.getTagForQr(tagId);
    const url = this.qrCodeService.buildScanUrl(tag.token);
    const sizeNum = parseInt(size, 10) || 300;

    if (format === 'svg') {
      const svg = await this.qrCodeService.generateSvg(url);
      res.set('Content-Type', 'image/svg+xml');
      res.set('Content-Disposition', `attachment; filename="scan2call-${tag.token}.svg"`);
      res.send(svg);
    } else {
      const png = await this.qrCodeService.generatePng(url, sizeNum);
      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', `attachment; filename="scan2call-${tag.token}.png"`);
      res.send(png);
    }
  }

  @Post(':tagId/qr-assets/regenerate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Regenerate QR assets for a tag' })
  async regenerateTagQrAssets(
    @CurrentUser() admin: JwtPayload,
    @Param('tagId') tagId: string,
  ) {
    return this.adminService.regenerateTagQrAssets(admin.id, tagId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag (status, label)' })
  async updateTag(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() body: {
      status?: TagStatus;
      label?: string;
    },
  ) {
    return this.adminService.updateTag(admin.id, id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Permanently delete a tag' })
  async deleteTag(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteTag(admin.id, id);
  }
}
