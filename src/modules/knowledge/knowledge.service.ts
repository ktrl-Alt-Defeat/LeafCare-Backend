import { knowledgeRepository } from './knowledge.repository.js';
import { CategoryDetailResponse, ArticleDetailResponse, KnowledgeFilterParams } from './knowledge.types.js';
import { NotFoundError } from '../../utils/app-error.js';
import { PaginatedResult } from '../../repositories/base.repository.js';

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
}

export const knowledgeService = new KnowledgeService();
