import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('store')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products (public, paginated)' })
  async findAll(
    @Query() query: ProductQueryDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    const result = await this.productsService.findAll(query);
    const canPurchase = await this.productsService.canUserPurchase(user?.id);

    return {
      ...result,
      data: result.data.map((product) => ({
        ...product,
        canPurchase,
      })),
    };
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'List featured products (public)' })
  async findFeatured(@CurrentUser() user?: JwtPayload) {
    const result = await this.productsService.findFeatured();
    const canPurchase = await this.productsService.canUserPurchase(user?.id);

    return {
      data: result.data.map((product) => ({
        ...product,
        canPurchase,
      })),
    };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug (public)' })
  async findBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const product = await this.productsService.findBySlug(slug);
    const canPurchase = await this.productsService.canUserPurchase(user?.id);

    return {
      data: {
        ...product,
        canPurchase,
      },
    };
  }
}
