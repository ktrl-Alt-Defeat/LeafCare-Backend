import { product_category } from '@prisma/client';
import { marketplaceRepository } from './marketplace.repository.js';
import {
  ProductDetailResponse,
  MarketplaceCategoryItem,
  MarketplaceFilterParams,
  ProductListItem,
  ProductWithRelations,
} from './marketplace.types.js';
import { NotFoundError } from '../../utils/app-error.js';
import { PaginatedResult } from '../../repositories/base.repository.js';

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
}

export const marketplaceService = new MarketplaceService();
