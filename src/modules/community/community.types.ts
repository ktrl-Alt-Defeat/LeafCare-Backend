import { posts, post_category, Prisma } from '@prisma/client';

export interface AuthorSummary {
  id: string;
  name: string;
}

export interface CropSummary {
  id: string;
  slug: string;
}

export interface CommentSummary {
  id: string;
  content: string;
  created_at: Date;
  author: AuthorSummary;
}

export type PostWithRelations = Prisma.postsGetPayload<{
  include: {
    user: { select: { id: true; name: true } };
    crop: { select: { id: true; slug: true } };
    comments: {
      include: {
        user: { select: { id: true; name: true } };
      };
    };
    _count: { select: { comments: true; likes: true } };
  };
}>;

export type PostListItem = Prisma.postsGetPayload<{
  include: {
    user: { select: { id: true; name: true } };
    crop: { select: { id: true; slug: true } };
    _count: { select: { comments: true; likes: true } };
  };
}>;

export interface PostDetailResponse extends posts {
  author: AuthorSummary;
  crop_summary: CropSummary | null;
  comments_count: number;
  likes_count: number;
  comments?: CommentSummary[];
}

export interface CommunityCategoryItem {
  category: post_category;
  title: string;
  description: string;
}

export interface CommunityFilterParams {
  page: number;
  limit: number;
  skip: number;
  category?: post_category;
  crop_id?: string;
  search?: string;
}
