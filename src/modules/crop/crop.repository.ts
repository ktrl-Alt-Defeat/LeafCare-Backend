import { crops, Prisma } from '@prisma/client';
import { BaseRepository } from '../../repositories/base.repository.js';
import { prisma } from '../../config/database.js';
import { CropFilterParams } from './crop.types.js';

export class CropRepository extends BaseRepository<
  crops,
  Prisma.cropsCreateInput,
  Prisma.cropsUpdateInput
> {
  constructor() {
    super('crops');
  }

  /**
   * Find crop by unique ID or slug with relations
   */
  async findByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    return prisma.crops.findUnique({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        crop_translations: true,
        crop_seasons: true,
        companions_source: {
          include: {
            companion_crop: {
              include: { crop_translations: true },
            },
          },
        },
        crop_diseases: {
          include: {
            disease: {
              include: { disease_translations: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find crops with filter params & translation joins
   */
  async findCropsWithTranslations(params: CropFilterParams) {
    const { skip, limit, season, life_cycle, search } = params;

    const where: Prisma.cropsWhereInput = {
      ...(season && { crop_seasons: { some: { season } } }),
      ...(life_cycle && { life_cycle }),
      ...(search && {
        OR: [
          { slug: { contains: search, mode: 'insensitive' } },
          { scientific_name: { contains: search, mode: 'insensitive' } },
          {
            crop_translations: {
              some: { crop_name: { contains: search, mode: 'insensitive' } },
            },
          },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      prisma.crops.count({ where }),
      prisma.crops.findMany({
        where,
        skip,
        take: limit,
        include: {
          crop_translations: true,
          crop_seasons: true,
        },
        orderBy: { slug: 'asc' },
      }),
    ]);

    return { total, items };
  }
}

export const cropRepository = new CropRepository();
