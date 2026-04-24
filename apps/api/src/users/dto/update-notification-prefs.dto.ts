import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationPrefsDto {
  @ApiPropertyOptional({ description: 'Receive notification when a tag is scanned' })
  @IsOptional()
  @IsBoolean()
  notifyOnScan?: boolean;

  @ApiPropertyOptional({ description: 'Receive notifications via SMS' })
  @IsOptional()
  @IsBoolean()
  notifyViaSms?: boolean;

  @ApiPropertyOptional({ description: 'Receive notifications via email' })
  @IsOptional()
  @IsBoolean()
  notifyViaEmail?: boolean;

  @ApiPropertyOptional({ description: 'Receive push notifications' })
  @IsOptional()
  @IsBoolean()
  notifyViaPush?: boolean;
}
