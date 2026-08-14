import { diseaseRepository } from './disease.repository.js';
import { DiseaseDetailResponse, DiseaseFilterParams } from './disease.types.js';
import { NotFoundError } from '../../utils/app-error.js';
import { PaginatedResult } from '../../repositories/base.repository.js';

export class DiseaseService {
  /**
   * List diseases with pagination and localized translation fallback
   */
  async getDiseases(params: DiseaseFilterParams): Promise<PaginatedResult<DiseaseDetailResponse>> {
    const { total, items } = await diseaseRepository.findDiseasesWithTranslations(params);

    const formattedDiseases: DiseaseDetailResponse[] = items.map((disease) => {
      const translation =
        disease.disease_translations.find((t) => t.language_code === params.lang) ||
        disease.disease_translations.find((t) => t.language_code === 'en') ||
        disease.disease_translations[0];

      return {
        ...disease,
        disease_name: translation ? translation.disease_name : disease.slug,
        symptoms: translation ? translation.symptoms : [],
        causes: translation ? translation.causes : [],
        prevention: translation ? translation.prevention : [],
        organic_treatment: translation ? translation.organic_treatment : [],
        chemical_treatment: translation ? translation.chemical_treatment : [],
      };
    });

    const totalPages = Math.ceil(total / params.limit);

    return {
      data: formattedDiseases,
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
   * Search diseases by symptom or name
   */
  async searchDiseases(params: DiseaseFilterParams): Promise<PaginatedResult<DiseaseDetailResponse>> {
    return this.getDiseases(params);
  }

  /**
   * Get single disease by ID or slug with complete relations and affected crop mapping
   */
  async getDiseaseByIdOrSlug(idOrSlug: string, lang: string = 'en'): Promise<DiseaseDetailResponse> {
    const disease = await diseaseRepository.findByIdOrSlug(idOrSlug);

    if (!disease) {
      throw new NotFoundError(`Disease not found with identifier '${idOrSlug}'`);
    }

    const translation =
      disease.disease_translations.find((t) => t.language_code === lang) ||
      disease.disease_translations.find((t) => t.language_code === 'en') ||
      disease.disease_translations[0];

    const affected_crops = disease.crop_diseases.map((cd) => {
      const cropTrans =
        cd.crop.crop_translations.find((t) => t.language_code === lang) ||
        cd.crop.crop_translations.find((t) => t.language_code === 'en') ||
        cd.crop.crop_translations[0];

      return {
        crop_id: cd.crop_id,
        crop_name: cropTrans ? cropTrans.crop_name : cd.crop.slug,
        is_primary_host: cd.is_primary_host,
      };
    });

    return {
      ...disease,
      disease_name: translation ? translation.disease_name : disease.slug,
      symptoms: translation ? translation.symptoms : [],
      causes: translation ? translation.causes : [],
      prevention: translation ? translation.prevention : [],
      organic_treatment: translation ? translation.organic_treatment : [],
      chemical_treatment: translation ? translation.chemical_treatment : [],
      affected_crops,
    };
  }
}

export const diseaseService = new DiseaseService();
