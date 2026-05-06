import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateQrTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Template config JSON' })
  @IsObject()
  config: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Whether the template is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateQrTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template config JSON' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Whether the template is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
