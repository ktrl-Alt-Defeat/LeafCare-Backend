import { post_category } from '@prisma/client';
import { communityRepository } from './community.repository.js';
import {
  PostDetailResponse,
  CommunityCategoryItem,
  CommunityFilterParams,
  PostListItem,
  PostWithRelations,
} from './community.types.js';
import { NotFoundError } from '../../utils/app-error.js';
import { PaginatedResult } from '../../repositories/base.repository.js';

export class CommunityService {
  /**
   * Get public community category metadata
   */
  getCategories(): CommunityCategoryItem[] {
    return [
      {
        category: post_category.general,
        title: 'General Discussion',
        description: 'General farming discussions, news, and agricultural updates.',
      },
      {
        category: post_category.disease_help,
        title: 'Pest & Disease Advisory',
        description: 'Ask for community and expert help identifying leaf lesions and crop symptoms.',
      },
      {
        category: post_category.crop_advice,
        title: 'Agronomy & Crop Advice',
        description: 'Share and learn best cultivation practices, spacing, and sowing techniques.',
      },
      {
        category: post_category.fertilizer,
        title: 'Soil & Fertilizer Management',
        description: 'Discussions on NPK ratios, organic compost, bio-fertilizers, and soil health.',
      },
      {
        category: post_category.irrigation,
        title: 'Water & Irrigation Systems',
        description: 'Drip irrigation, rainwater harvesting, and water conservation guidance.',
      },
      {
        category: post_category.weather,
        title: 'Weather & Climate Alert',
        description: 'Monsoon predictions, frost protection, and seasonal weather advice.',
      },
      {
        category: post_category.marketplace,
        title: 'Produce & Trade Forum',
        description: 'Community buy, sell, and equipment rental discussions.',
      },
    ];
  }

  /**
   * List community posts with pagination and metadata
   */
  async getPosts(params: CommunityFilterParams): Promise<PaginatedResult<PostDetailResponse>> {
    const { total, items } = await communityRepository.findPostsWithFilter(params);

    const formattedPosts: PostDetailResponse[] = items.map((post: PostListItem) => ({
      ...post,
      author: {
        id: post.user.id,
        name: post.user.name,
      },
      crop_summary: post.crop ? { id: post.crop.id, slug: post.crop.slug } : null,
      comments_count: post._count.comments,
      likes_count: post._count.likes,
    }));

    const totalPages = Math.ceil(total / params.limit);

    return {
      data: formattedPosts,
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
   * Search posts by title or content
   */
  async searchPosts(params: CommunityFilterParams): Promise<PaginatedResult<PostDetailResponse>> {
    return this.getPosts(params);
  }

  /**
   * Get detailed post by ID with comments thread
   */
  async getPostById(id: string): Promise<PostDetailResponse> {
    const post: PostWithRelations | null = await communityRepository.findPostByIdWithDetails(id);

    if (!post) {
      throw new NotFoundError(`Community post not found with ID '${id}'`);
    }

    const comments = post.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      author: {
        id: comment.user.id,
        name: comment.user.name,
      },
    }));

    return {
      ...post,
      author: {
        id: post.user.id,
        name: post.user.name,
      },
      crop_summary: post.crop ? { id: post.crop.id, slug: post.crop.slug } : null,
      comments_count: post._count.comments,
      likes_count: post._count.likes,
      comments,
    };
  }
}

export const communityService = new CommunityService();
