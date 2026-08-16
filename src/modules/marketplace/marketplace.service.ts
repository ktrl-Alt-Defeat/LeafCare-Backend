import { product_category } from '@prisma/client';
import { marketplaceRepository } from './marketplace.repository.js';
import {
  ProductDetailResponse,
  MarketplaceCategoryItem,
  MarketplaceFilterParams,
  ProductListItem,
  ProductWithRelations,
} from './marketplace.types.js';
import { BadRequestError, NotFoundError } from '../../utils/app-error.js';
import { PaginatedResult } from '../../repositories/base.repository.js';
import { prisma } from '../../config/database.js';
import type { CreateProductBody, UpdateProductBody } from './marketplace.validation.js';

export class MarketplaceService {
  /**
   * Get public marketplace category metadata
   */
  getCategories(): MarketplaceCategoryItem[] {
    return [
      {
        category: product_category.seeds,
        title: 'High-Yield Seeds & Planting Stock',
        description: 'Certified hybrid, heirloom, and disease-resistant crop seeds.',
      },
      {
        category: product_category.fertilizers,
        title: 'Fertilizers & Soil Amendments',
        description: 'Organic compost, NPK blends, micro-nutrients, and soil conditioners.',
      },
      {
        category: product_category.crop_protection,
        title: 'Crop Protection & Bio-Pesticides',
        description: 'Fungicides, insecticides, neem oil, and organic plant protection remedies.',
      },
      {
        category: product_category.tools,
        title: 'Farming Hand Tools & Hardware',
        description: 'Pruning shears, sprayers, soil moisture meters, and hand tools.',
      },
      {
        category: product_category.equipment,
        title: 'Heavy Machinery & Irrigation Equipment',
        description: 'Tractors, drip irrigation kits, tillers, and machinery.',
      },
    ];
  }

  /**
   * List marketplace products with rating calculations
   */
  async getProducts(params: MarketplaceFilterParams): Promise<PaginatedResult<ProductDetailResponse>> {
    const { total, items } = await marketplaceRepository.findProductsWithFilter(params);

    const formattedProducts: ProductDetailResponse[] = items.map((product: ProductListItem) => {
      const totalRatings = product.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
      const reviews_count = product.reviews.length;
      const average_rating = reviews_count > 0 ? Number((totalRatings / reviews_count).toFixed(1)) : 0;

      const { reviews, ...productData } = product;

      return {
        ...productData,
        seller: {
          id: product.seller.id,
          name: product.seller.name,
        },
        average_rating,
        reviews_count,
      };
    });

    const totalPages = Math.ceil(total / params.limit);

    return {
      data: formattedProducts,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1,
      },
    };
  }

  /**
   * Search products by name or description
   */
  async searchProducts(params: MarketplaceFilterParams): Promise<PaginatedResult<ProductDetailResponse>> {
    return this.getProducts(params);
  }

  /**
   * Get single product by ID with seller details & customer reviews
   */
  async getProductById(id: string): Promise<ProductDetailResponse> {
    const product: ProductWithRelations | null = await marketplaceRepository.findProductByIdWithDetails(id);

    if (!product) {
      throw new NotFoundError(`Marketplace product not found with ID '${id}'`);
    }

    const totalRatings = product.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
    const reviews_count = product.reviews.length;
    const average_rating = reviews_count > 0 ? Number((totalRatings / reviews_count).toFixed(1)) : 0;

    const reviews = product.reviews.map((rev) => ({
      id: rev.id,
      rating: rev.rating,
      comment: rev.comment,
      created_at: rev.created_at,
      reviewer_name: rev.user.name,
    }));

    return {
      ...product,
      seller: {
        id: product.seller.id,
        name: product.seller.name,
      },
      average_rating,
      reviews_count,
      reviews,
    };
  }

  /**
   * Creates a listing.
   *
   * The seller must already exist: `seller_id` is a foreign key, and letting
   * Prisma raise the constraint error would surface as a 500 rather than
   * telling the caller which field is wrong.
   */
  async createProduct(body: CreateProductBody) {
    const seller = await prisma.users.findFirst({
      where: { id: body.seller_id, deleted_at: null },
    });

    if (!seller) {
      throw new BadRequestError(`No user found with id '${body.seller_id}' to own this listing.`);
    }

    const created = await marketplaceRepository.createProduct({
      seller_id: body.seller_id,
      name: body.name,
      category: body.category,
      description: body.description ?? null,
      price: body.price,
      currency_code: body.currency_code,
      unit: body.unit,
      stock_quantity: body.stock_quantity,
      is_organic: body.is_organic,
      image_url: body.image_url ?? null,
    });

    return this.getProductById(created.id);
  }

  async updateProduct(id: string, body: UpdateProductBody) {
    // An empty body would otherwise "succeed" while changing nothing, which
    // reads as a silent failure to the caller.
    if (Object.keys(body).length === 0) {
      throw new BadRequestError('Provide at least one field to update.');
    }

    const updated = await marketplaceRepository.updateProduct(id, body);

    if (!updated) {
      throw new NotFoundError(`Marketplace product not found with ID '${id}'`);
    }

    return this.getProductById(updated.id);
  }

  async deleteProduct(id: string): Promise<{ id: string }> {
    const deleted = await marketplaceRepository.softDeleteProduct(id);

    if (!deleted) {
      throw new NotFoundError(`Marketplace product not found with ID '${id}'`);
    }

    return { id: deleted.id };
  }
}

export const marketplaceService = new MarketplaceService();
