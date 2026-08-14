import { cropRepository } from './crop.repository.js';
import { CropDetailResponse, CropFilterParams } from './crop.types.js';
import { NotFoundError } from '../../utils/app-error.js';
import { PaginatedResult } from '../../repositories/base.repository.js';

export class CropService {
  /**
   * List crops with pagination and localized translation fallback
   */
  async getCrops(params: CropFilterParams): Promise<PaginatedResult<CropDetailResponse>> {
    const { total, items } = await cropRepository.findCropsWithTranslations(params);

    const formattedCrops: CropDetailResponse[] = items.map((crop) => {
      const translation =
        crop.crop_translations.find((t) => t.language_code === params.lang) ||
        crop.crop_translations.find((t) => t.language_code === 'en') ||
        crop.crop_translations[0];

      const seasons = crop.crop_seasons.map((s) => s.season);

      return {
        ...crop,
        crop_name: translation ? translation.crop_name : crop.slug,
        description: translation ? translation.description : null,
        sowing_method: translation ? translation.sowing_method : null,
        harvesting_guide: translation ? translation.harvesting_guide : null,
        seasons,
      };
    });

    const totalPages = Math.ceil(total / params.limit);

    return {
      data: formattedCrops,
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
   * Search crops by name or slug
   */
  async searchCrops(params: CropFilterParams): Promise<PaginatedResult<CropDetailResponse>> {
    return this.getCrops(params);
  }

  /**
   * Get single crop by ID or slug with complete relations and companion mapping
   */
  async getCropByIdOrSlug(idOrSlug: string, lang: string = 'en'): Promise<CropDetailResponse> {
    const crop = await cropRepository.findByIdOrSlug(idOrSlug);

    if (!crop) {
      throw new NotFoundError(`Crop not found with identifier '${idOrSlug}'`);
    }

    const translation =
      crop.crop_translations.find((t) => t.language_code === lang) ||
      crop.crop_translations.find((t) => t.language_code === 'en') ||
      crop.crop_translations[0];

    const seasons = crop.crop_seasons.map((s) => s.season);

    const companions = crop.companions_source.map((comp) => {
      const compTrans =
        comp.companion_crop.crop_translations.find((t) => t.language_code === lang) ||
        comp.companion_crop.crop_translations.find((t) => t.language_code === 'en') ||
        comp.companion_crop.crop_translations[0];

      return {
        companion_crop_id: comp.companion_crop_id,
        companion_name: compTrans ? compTrans.crop_name : comp.companion_crop.slug,
        relationship: comp.relationship,
      };
    });

    return {
      ...crop,
      crop_name: translation ? translation.crop_name : crop.slug,
      description: translation ? translation.description : null,
      sowing_method: translation ? translation.sowing_method : null,
      harvesting_guide: translation ? translation.harvesting_guide : null,
      seasons,
      companions,
    };
  }
}

export const cropService = new CropService();
