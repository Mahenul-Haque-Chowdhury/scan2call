import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TagType } from '@scan2call/shared';

export class CreateTagDto {
  @ApiProperty({ enum: TagType, example: 'PET_COLLAR' })
  @IsEnum(TagType)
  type: TagType;

  @ApiProperty({ required: false, example: 'My dog Max' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiProperty({ required: false, example: 'Golden retriever, friendly' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
