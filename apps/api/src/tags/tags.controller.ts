import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { PhoneVerifiedGuard } from '../common/guards';
import { TagsService } from './tags.service';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ActivateTagDto } from './dto/activate-tag.dto';
import { ToggleLostModeDto } from './dto/toggle-lost-mode.dto';

@ApiTags('tags')
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tags for the authenticated user' })
  async findAll(@CurrentUser() user: JwtPayload) {
    const tags = await this.tagsService.findAllForUser(user.id);
    return { data: tags };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tag by ID' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const tag = await this.tagsService.findOneForUser(user.id, id);
    return { data: tag };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ) {
    const tag = await this.tagsService.update(user.id, id, dto);
    return { data: tag };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate (soft-delete) a tag' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.tagsService.remove(user.id, id);
  }

  @UseGuards(PhoneVerifiedGuard)
  @Post('activate')
  @ApiOperation({ summary: 'Activate (claim) a tag by its token' })
  async activate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ActivateTagDto,
  ) {
    const tag = await this.tagsService.activate(user.id, dto);
    return { data: tag };
  }

  @Patch(':id/lost-mode')
  @ApiOperation({ summary: 'Toggle lost mode on/off for a tag' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  async toggleLostMode(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ToggleLostModeDto,
  ) {
    const tag = await this.tagsService.toggleLostMode(user.id, id, dto);
    return { data: tag };
  }

  @Get(':id/scans')
  @ApiOperation({ summary: 'Get scan history for a specific tag' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getScans(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tagsService.getTagScans(
      user.id,
      id,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}
