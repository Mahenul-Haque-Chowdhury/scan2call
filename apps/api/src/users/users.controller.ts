import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import { SavedAddressDto, UpdateSavedAddressDto } from './dto/saved-address.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotificationPrefs(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.usersService.updateNotificationPrefs(user.id, dto);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get dashboard statistics for current user' })
  async getStats(@CurrentUser() user: JwtPayload) {
    return this.usersService.getDashboardStats(user.id);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'List current user saved addresses' })
  async listSavedAddresses(@CurrentUser() user: JwtPayload) {
    return this.usersService.listSavedAddresses(user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Create a saved address for current user' })
  async createSavedAddress(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SavedAddressDto,
  ) {
    return this.usersService.createSavedAddress(user.id, dto);
  }

  @Patch('me/addresses/:addressId')
  @ApiOperation({ summary: 'Update a saved address for current user' })
  async updateSavedAddress(
    @CurrentUser() user: JwtPayload,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateSavedAddressDto,
  ) {
    return this.usersService.updateSavedAddress(user.id, addressId, dto);
  }

  @Patch('me/addresses/:addressId/default')
  @ApiOperation({ summary: 'Mark a saved address as default' })
  async setDefaultSavedAddress(
    @CurrentUser() user: JwtPayload,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.setDefaultSavedAddress(user.id, addressId);
  }

  @Delete('me/addresses/:addressId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved address for current user' })
  async deleteSavedAddress(
    @CurrentUser() user: JwtPayload,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.deleteSavedAddress(user.id, addressId);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete current user account' })
  async deleteMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.softDelete(user.id);
  }
}
