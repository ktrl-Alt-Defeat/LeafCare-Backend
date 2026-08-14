import { products, product_category, Prisma } from '@prisma/client';

export interface SellerSummary {
  id: string;
  name: string;
}

export interface ReviewSummary {
  id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  reviewer_name: string;
}

export type ProductWithRelations = Prisma.productsGetPayload<{
  include: {
    seller: { select: { id: true; name: true } };
    reviews: {
      include: {
        user: { select: { id: true; name: true } };
      };
    };
  };
}>;

export type ProductListItem = Prisma.productsGetPayload<{
  include: {
    seller: { select: { id: true; name: true } };
    reviews: { select: { rating: true } };
  };
}>;

export interface ProductDetailResponse extends products {
  seller: SellerSummary;
  average_rating: number;
  reviews_count: number;
  reviews?: ReviewSummary[];
}

export interface MarketplaceCategoryItem {
  category: product_category;
  title: string;
  description: string;
}

export interface MarketplaceFilterParams {
  page: number;
  limit: number;
  skip: number;
  category?: product_category;
  is_organic?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
}
