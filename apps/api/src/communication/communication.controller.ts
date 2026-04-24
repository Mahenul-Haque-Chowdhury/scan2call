import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CommunicationService } from './communication.service';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendLocationDto } from './dto/send-location.dto';

@ApiTags('communication')
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  // ────────────────────────────────────────────
  // Public endpoints (finder-initiated, rate-limited)
  // ────────────────────────────────────────────

  @Post('call')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Get Twilio Client token for browser-based anonymous voice call' })
  async initiateCall(@Body() dto: InitiateCallDto) {
    const result = await this.communicationService.initiateCall(dto);
    return { data: result };
  }

  @Post('sms')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Send anonymous SMS message to tag owner' })
  async initiateSms(@Body() dto: SendSmsDto) {
    const result = await this.communicationService.initiateSms(dto);
    return { data: result };
  }

  @Post('whatsapp')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Send anonymous WhatsApp message to tag owner' })
  async initiateWhatsApp(@Body() dto: SendSmsDto) {
    const result = await this.communicationService.initiateWhatsApp(dto);
    return { data: result };
  }

  @Post('send-location')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Send finder location to tag owner via SMS' })
  async sendLocation(@Body() dto: SendLocationDto) {
    const result = await this.communicationService.sendLocation(dto);
    return { data: result };
  }

  // ────────────────────────────────────────────
  // Authenticated endpoints (tag owner)
  // ────────────────────────────────────────────

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get communication history for the authenticated user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.communicationService.getHistory(
      user.id,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single communication log entry' })
  @ApiParam({ name: 'id', description: 'Communication log ID' })
  async getOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const log = await this.communicationService.getOne(user.id, id);
    return { data: log };
  }
}
