import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { BlogPostQueryDto } from './dto/blog-post-query.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: BlogPostQueryDto) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 12, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.BlogPostWhereInput = {
      deletedAt: null,
      isPublished: true,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { excerpt: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          category: true,
          tags: true,
          isFeatured: true,
          publishedAt: true,
          createdAt: true,
          metaTitle: true,
          metaDescription: true,
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: { page, pageSize, total },
    };
  }

  async findFeatured() {
    const posts = await this.prisma.blogPost.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        isFeatured: true,
      },
      take: 3,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        category: true,
        tags: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return { data: posts };
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug,
        deletedAt: null,
        isPublished: true,
      },
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return post;
  }
}
