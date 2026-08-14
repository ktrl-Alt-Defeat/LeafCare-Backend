import { knowledge_articles, Prisma } from '@prisma/client';
import { BaseRepository } from '../../repositories/base.repository.js';
import { prisma } from '../../config/database.js';
import { KnowledgeFilterParams } from './knowledge.types.js';

export class KnowledgeRepository extends BaseRepository<
  knowledge_articles,
  Prisma.knowledge_articlesCreateInput,
  Prisma.knowledge_articlesUpdateInput
> {
  constructor() {
    super('knowledge_articles');
  }

  /**
   * Fetch all knowledge base categories with translations
   */
  async findCategoriesWithTranslations() {
    return prisma.knowledge_categories.findMany({
      include: {
        knowledge_category_translations: true,
      },
      orderBy: { sort_order: 'asc' },
    });
  }

  /**
   * Find article by unique ID or slug with complete relations
   */
  async findArticleByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    return prisma.knowledge_articles.findUnique({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        category: {
          include: { knowledge_category_translations: true },
        },
        knowledge_article_translations: true,
        knowledge_article_crops: {
          include: {
            crop: { include: { crop_translations: true } },
          },
        },
        knowledge_article_diseases: {
          include: {
            disease: { include: { disease_translations: true } },
          },
        },
      },
    });
  }

  /**
   * List articles with filter options and translation joins
   */
  async findArticlesWithTranslations(params: KnowledgeFilterParams) {
    const { skip, limit, category_id, crop_id, disease_id, search } = params;

    const where: Prisma.knowledge_articlesWhereInput = {
      ...(category_id && { category_id }),
      ...(crop_id && { knowledge_article_crops: { some: { crop_id } } }),
      ...(disease_id && { knowledge_article_diseases: { some: { disease_id } } }),
      ...(search && {
        OR: [
          { slug: { contains: search, mode: 'insensitive' } },
          {
            knowledge_article_translations: {
              some: {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { summary: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      prisma.knowledge_articles.count({ where }),
      prisma.knowledge_articles.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            include: { knowledge_category_translations: true },
          },
          knowledge_article_translations: true,
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return { total, items };
  }
}

export const knowledgeRepository = new KnowledgeRepository();
