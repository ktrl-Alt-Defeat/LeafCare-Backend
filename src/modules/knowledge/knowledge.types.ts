import { knowledge_categories, knowledge_articles } from '@prisma/client';

export interface CategoryDetailResponse extends knowledge_categories {
  category_name: string;
  description: string | null;
}

export interface ArticleDetailResponse extends knowledge_articles {
  title: string;
  summary: string | null;
  body: string;
  category_name?: string;
  crops?: Array<{ crop_id: string; crop_name: string }>;
  diseases?: Array<{ disease_id: string; disease_name: string }>;
}

export interface KnowledgeFilterParams {
  page: number;
  limit: number;
  skip: number;
  lang: string;
  category_id?: string;
  crop_id?: string;
  disease_id?: string;
  search?: string;
}
