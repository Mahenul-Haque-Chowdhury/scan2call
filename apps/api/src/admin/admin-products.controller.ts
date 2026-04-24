import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TagType } from '@prisma/client';
import { Role } from '@scan2call/shared';
import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

class CreateProductImageDto {
  @IsString()
  @MaxLength(2000)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@ApiTags('admin/products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all products (including inactive/deleted)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tagType', required: false, enum: TagType })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  async listProducts(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('tagType') tagType?: TagType,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.adminService.listProducts({
      page,
      pageSize,
      search,
      tagType,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details' })
  async getProduct(@Param('id') id: string) {
    return this.adminService.getProductById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new product' })
  async createProduct(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.adminService.createProduct(admin.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  async updateProduct(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(admin.id, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a product' })
  async deleteProduct(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteProduct(admin.id, id);
  }

  // ── Product Images ──

  @Post(':id/images')
  @ApiOperation({ summary: 'Add an image to a product' })
  async addProductImage(
    @Param('id') productId: string,
    @Body() dto: CreateProductImageDto,
  ) {
    return this.adminService.addProductImage(productId, dto);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Remove a product image' })
  async removeProductImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.adminService.removeProductImage(productId, imageId);
  }
}
