import { knowledgeRepository } from './knowledge.repository.js';
import { CategoryDetailResponse, ArticleDetailResponse, KnowledgeFilterParams } from './knowledge.types.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/app-error.js';
import { PaginatedResult } from '../../repositories/base.repository.js';
import { prisma } from '../../config/database.js';
import type { CreateArticleBody, UpdateArticleBody } from './knowledge.validation.js';

export class KnowledgeService {
  /**
   * Get all knowledge categories with localized translations
   */
  async getCategories(lang: string = 'en'): Promise<CategoryDetailResponse[]> {
    const categories = await knowledgeRepository.findCategoriesWithTranslations();

    return categories.map((cat) => {
      const translation =
        cat.knowledge_category_translations.find((t) => t.language_code === lang) ||
        cat.knowledge_category_translations.find((t) => t.language_code === 'en') ||
        cat.knowledge_category_translations[0];

      return {
        ...cat,
        category_name: translation ? translation.category_name : cat.slug,
        description: translation ? translation.description : null,
      };
    });
  }

  /**
   * List knowledge base articles with localized translation fallback
   */
  async getArticles(params: KnowledgeFilterParams): Promise<PaginatedResult<ArticleDetailResponse>> {
    const { total, items } = await knowledgeRepository.findArticlesWithTranslations(params);

    const formattedArticles: ArticleDetailResponse[] = items.map((article) => {
      const translation =
        article.knowledge_article_translations.find((t) => t.language_code === params.lang) ||
        article.knowledge_article_translations.find((t) => t.language_code === 'en') ||
        article.knowledge_article_translations[0];

      const catTrans =
        article.category.knowledge_category_translations.find((t) => t.language_code === params.lang) ||
        article.category.knowledge_category_translations.find((t) => t.language_code === 'en') ||
        article.category.knowledge_category_translations[0];

      return {
        ...article,
        title: translation ? translation.title : article.slug,
        summary: translation ? translation.summary : null,
        body: translation ? translation.body : '',
        category_name: catTrans ? catTrans.category_name : article.category.slug,
      };
    });

    const totalPages = Math.ceil(total / params.limit);

    return {
      data: formattedArticles,
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
   * Get single article by ID or slug with complete content, crops & diseases
   */
  async getArticleByIdOrSlug(idOrSlug: string, lang: string = 'en'): Promise<ArticleDetailResponse> {
    const article = await knowledgeRepository.findArticleByIdOrSlug(idOrSlug);

    if (!article) {
      throw new NotFoundError(`Knowledge article not found with identifier '${idOrSlug}'`);
    }

    const translation =
      article.knowledge_article_translations.find((t) => t.language_code === lang) ||
      article.knowledge_article_translations.find((t) => t.language_code === 'en') ||
      article.knowledge_article_translations[0];

    const catTrans =
      article.category.knowledge_category_translations.find((t) => t.language_code === lang) ||
      article.category.knowledge_category_translations.find((t) => t.language_code === 'en') ||
      article.category.knowledge_category_translations[0];

    const crops = article.knowledge_article_crops.map((ac) => {
      const cropTrans =
        ac.crop.crop_translations.find((t) => t.language_code === lang) ||
        ac.crop.crop_translations.find((t) => t.language_code === 'en') ||
        ac.crop.crop_translations[0];

      return {
        crop_id: ac.crop_id,
        crop_name: cropTrans ? cropTrans.crop_name : ac.crop.slug,
      };
    });

    const diseases = article.knowledge_article_diseases.map((ad) => {
      const disTrans =
        ad.disease.disease_translations.find((t) => t.language_code === lang) ||
        ad.disease.disease_translations.find((t) => t.language_code === 'en') ||
        ad.disease.disease_translations[0];

      return {
        disease_id: ad.disease_id,
        disease_name: disTrans ? disTrans.disease_name : ad.disease.slug,
      };
    });

    return {
      ...article,
      title: translation ? translation.title : article.slug,
      summary: translation ? translation.summary : null,
      body: translation ? translation.body : '',
      category_name: catTrans ? catTrans.category_name : article.category.slug,
      crops,
      diseases,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Admin writes                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Creates an article and its translations in one transaction, so a failure
   * partway through cannot leave an article with no readable copy.
   */
  async createArticle(body: CreateArticleBody): Promise<ArticleDetailResponse> {
    const category = await prisma.knowledge_categories.findUnique({
      where: { id: body.category_id },
    });
    if (!category) {
      throw new BadRequestError(`No knowledge category found with id '${body.category_id}'.`);
    }

    const existing = await prisma.knowledge_articles.findUnique({ where: { slug: body.slug } });
    if (existing) {
      throw new ConflictError(`An article with slug '${body.slug}' already exists.`);
    }

    const created = await prisma.$transaction(async (tx) => {
      const article = await tx.knowledge_articles.create({
        data: {
          category_id: body.category_id,
          author_id: body.author_id ?? null,
          slug: body.slug,
          hero_image_url: body.hero_image_url ?? null,
          // A null published_at is the draft state; list queries filter on it.
          published_at: body.published ? new Date() : null,
        },
      });

      await tx.knowledge_article_translations.createMany({
        data: body.translations.map((row) => ({
          article_id: article.id,
          language_code: row.language_code,
          title: row.title,
          summary: row.summary ?? null,
          body: row.body,
        })),
      });

      return article;
    });

    return this.getArticleByIdOrSlug(created.id, 'en');
  }

  async updateArticle(idOrSlug: string, body: UpdateArticleBody): Promise<ArticleDetailResponse> {
    // An empty body would otherwise report success while changing nothing.
    if (Object.keys(body).length === 0) {
      throw new BadRequestError('Provide at least one field to update.');
    }

    const article = await this.findArticleRecord(idOrSlug);

    await prisma.$transaction(async (tx) => {
      await tx.knowledge_articles.update({
        where: { id: article.id },
        data: {
          ...(body.category_id ? { category_id: body.category_id } : {}),
          ...(body.slug ? { slug: body.slug } : {}),
          ...(body.hero_image_url !== undefined ? { hero_image_url: body.hero_image_url } : {}),
          // Re-publishing keeps the original date rather than backdating it.
          ...(body.published !== undefined
            ? { published_at: body.published ? (article.published_at ?? new Date()) : null }
            : {}),
          updated_at: new Date(),
        },
      });

      // Upserted per language: editing Hindi must not wipe the English copy.
      for (const row of body.translations ?? []) {
        await tx.knowledge_article_translations.upsert({
          where: {
            article_id_language_code: {
              article_id: article.id,
              language_code: row.language_code,
            },
          },
          update: { title: row.title, summary: row.summary ?? null, body: row.body },
          create: {
            article_id: article.id,
            language_code: row.language_code,
            title: row.title,
            summary: row.summary ?? null,
            body: row.body,
          },
        });
      }
    });

    return this.getArticleByIdOrSlug(article.id, 'en');
  }

  /**
   * Hard delete. Unlike products, articles are not referenced by order history,
   * and the schema cascades their translations and crop/disease links.
   */
  async deleteArticle(idOrSlug: string): Promise<{ id: string }> {
    const article = await this.findArticleRecord(idOrSlug);
    await prisma.knowledge_articles.delete({ where: { id: article.id } });
    return { id: article.id };
  }

  /** Resolves an article by slug or UUID, or throws 404. */
  private async findArticleRecord(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const article = await prisma.knowledge_articles.findFirst({
      where: { OR: [{ slug: idOrSlug }, ...(isUuid ? [{ id: idOrSlug }] : [])] },
    });

    if (!article) {
      throw new NotFoundError(`Knowledge article not found: '${idOrSlug}'`);
    }
    return article;
  }
}

export const knowledgeService = new KnowledgeService();
