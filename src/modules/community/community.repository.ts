import { posts, Prisma } from '@prisma/client';
import { BaseRepository } from '../../repositories/base.repository.js';
import { prisma } from '../../config/database.js';
import { CommunityFilterParams, PostWithRelations, PostListItem } from './community.types.js';

export class CommunityRepository extends BaseRepository<
  posts,
  Prisma.postsCreateInput,
  Prisma.postsUpdateInput
> {
  constructor() {
    super('posts');
  }

  /**
   * Find single post by ID with author details, crop summary, and comment thread
   */
  async findPostByIdWithDetails(id: string): Promise<PostWithRelations | null> {
    return prisma.posts.findFirst({
      where: { id, deleted_at: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        crop: {
          select: {
            id: true,
            slug: true,
          },
        },
        comments: {
          where: { deleted_at: null },
          orderBy: { created_at: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: { where: { deleted_at: null } },
            likes: true,
          },
        },
      },
    });
  }

  /**
   * Find community posts with filters, pagination, and relation counts
   */
  async findPostsWithFilter(params: CommunityFilterParams): Promise<{ total: number; items: PostListItem[] }> {
    const { skip, limit, category, crop_id, search } = params;

    const where: Prisma.postsWhereInput = {
      deleted_at: null,
      ...(category && { category }),
      ...(crop_id && { crop_id }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      prisma.posts.count({ where }),
      prisma.posts.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          crop: {
            select: {
              id: true,
              slug: true,
            },
          },
          _count: {
            select: {
              comments: { where: { deleted_at: null } },
              likes: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return { total, items };
  }
}

export const communityRepository = new CommunityRepository();
