import { products, Prisma } from '@prisma/client';
import { BaseRepository } from '../../repositories/base.repository.js';
import { prisma } from '../../config/database.js';
import { MarketplaceFilterParams, ProductWithRelations, ProductListItem } from './marketplace.types.js';

export class MarketplaceRepository extends BaseRepository<
  products,
  Prisma.productsCreateInput,
  Prisma.productsUpdateInput
> {
  constructor() {
    super('products');
  }

  /**
   * Find product by ID with seller info and reviews breakdown
   */
  async findProductByIdWithDetails(id: string): Promise<ProductWithRelations | null> {
    return prisma.products.findFirst({
      where: { id, deleted_at: null },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        reviews: {
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find marketplace products with filtering and pagination
   */
  async findProductsWithFilter(params: MarketplaceFilterParams): Promise<{ total: number; items: ProductListItem[] }> {
    const { skip, limit, category, is_organic, min_price, max_price, search } = params;

    const where: Prisma.productsWhereInput = {
      deleted_at: null,
      ...(category && { category }),
      ...(is_organic !== undefined && { is_organic }),
      ...((min_price !== undefined || max_price !== undefined) && {
        price: {
          ...(min_price !== undefined && { gte: min_price }),
          ...(max_price !== undefined && { lte: max_price }),
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      prisma.products.count({ where }),
      prisma.products.findMany({
        where,
        skip,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return { total, items };
  }

  /** Creates a listing owned by the given seller. */
  async createProduct(data: Prisma.productsUncheckedCreateInput): Promise<products> {
    return prisma.products.create({ data });
  }

  /** Updates a listing, ignoring rows already soft-deleted. */
  async updateProduct(id: string, data: Prisma.productsUpdateInput): Promise<products | null> {
    const existing = await prisma.products.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return null;

    return prisma.products.update({
      where: { id },
      data: { ...data, updated_at: new Date() },
    });
  }

  /**
   * Soft delete. Order history references products, so a hard delete would
   * break past orders; every read already filters on `deleted_at: null`.
   */
  async softDeleteProduct(id: string): Promise<products | null> {
    const existing = await prisma.products.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return null;

    return prisma.products.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}

export const marketplaceRepository = new MarketplaceRepository();
