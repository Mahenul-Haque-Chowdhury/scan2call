import {
  Controller,
  Get,
  Post,
  Patch,
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
import { QrCodeService } from '../qr-code/qr-code.service';

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

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag (status, label)' })
  async updateTag(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status?: TagStatus; label?: string },
  ) {
    return this.adminService.updateTag(admin.id, id, body);
  }
}
