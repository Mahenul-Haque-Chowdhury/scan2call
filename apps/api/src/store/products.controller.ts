import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';

// The store is open to everyone now (no subscription gate). canPurchase is kept
// (always true) for frontend compatibility until the store UI is updated. @deprecated
const CAN_PURCHASE = true;

@ApiTags('store')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products (public, paginated)' })
  async findAll(@Query() query: ProductQueryDto) {
    const result = await this.productsService.findAll(query);

    return {
      ...result,
      data: result.data.map((product) => ({
        ...product,
        canPurchase: CAN_PURCHASE,
      })),
    };
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'List featured products (public)' })
  async findFeatured() {
    const result = await this.productsService.findFeatured();

    return {
      data: result.data.map((product) => ({
        ...product,
        canPurchase: CAN_PURCHASE,
      })),
    };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug (public)' })
  async findBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.findBySlug(slug);

    return {
      data: {
        ...product,
        canPurchase: CAN_PURCHASE,
      },
    };
  }
}
