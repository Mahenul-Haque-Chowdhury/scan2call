import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { TagType } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const { page = 1, pageSize = 12, tagType } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      isActive: true,
      deletedAt: null,
      ...(tagType ? { tagType: tagType as TagType } : {}),
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: { page, pageSize, total },
    };
  }

  async findFeatured() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return { data: products };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Checks whether a user has an active subscription.
   * Returns false if userId is null/undefined (unauthenticated visitor).
   */
  async canUserPurchase(userId: string | undefined): Promise<boolean> {
    if (!userId) return false;

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true },
    });

    return subscription?.status === 'ACTIVE';
  }
}
