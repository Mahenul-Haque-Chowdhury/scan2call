import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@scan2call/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { QrCodeService, QrRenderOptions } from '../qr-code/qr-code.service';
import type { Prisma } from '@/generated/prisma/client';
import { CreateQrTemplateDto, UpdateQrTemplateDto, SetDefaultQrDesignTemplateDto } from './dto/qr-template.dto';

@ApiTags('admin/qr-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/qr-templates')
export class AdminQrTemplatesController {
  constructor(
    private readonly adminService: AdminService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List QR design templates' })
  async listTemplates() {
    return this.adminService.listQrTemplates();
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default QR design template' })
  async getDefaultTemplate() {
    return this.adminService.getDefaultQrDesignTemplate();
  }

  @Patch('default')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set default QR design template' })
  async setDefaultTemplate(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: SetDefaultQrDesignTemplateDto,
  ) {
    return this.adminService.setDefaultQrDesignTemplate(admin.id, dto.templateId ?? null);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a QR design template' })
  async createTemplate(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateQrTemplateDto,
  ) {
    return this.adminService.createQrTemplate(admin.id, {
      ...dto,
      config: dto.config as Prisma.InputJsonValue,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a QR design template' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateQrTemplateDto,
  ) {
    return this.adminService.updateQrTemplate(id, {
      ...dto,
      config: dto.config as Prisma.InputJsonValue,
    });
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview a QR design template' })
  @ApiQuery({ name: 'format', required: false, enum: ['png', 'svg'] })
  async previewTemplate(
    @Param('id') id: string,
    @Query('format') format: string = 'svg',
    @Res() res: Response,
  ) {
    const template = await this.adminService.getQrTemplateById(id);
    const scanUrl = this.qrCodeService.buildScanUrl('SAMPLE123456');

    if (format === 'png') {
      const png = await this.qrCodeService.generatePngWithOptions(scanUrl, template.config as QrRenderOptions);
      res.set('Content-Type', 'image/png');
      res.send(png);
    } else {
      const svg = await this.qrCodeService.generateSvgWithOptions(scanUrl, template.config as QrRenderOptions);
      res.set('Content-Type', 'image/svg+xml');
      res.send(svg);
     }
   }
 }
