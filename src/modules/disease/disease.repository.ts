import { diseases, Prisma } from '@prisma/client';
import { BaseRepository } from '../../repositories/base.repository.js';
import { prisma } from '../../config/database.js';
import { DiseaseFilterParams } from './disease.types.js';

export class DiseaseRepository extends BaseRepository<
  diseases,
  Prisma.diseasesCreateInput,
  Prisma.diseasesUpdateInput
> {
  constructor() {
    super('diseases');
  }

  /**
   * Find disease by unique ID or slug with relations
   */
  async findByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    return prisma.diseases.findUnique({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        disease_translations: true,
        crop_diseases: {
          include: {
            crop: {
              include: { crop_translations: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find diseases with filter params & translation joins
   */
  async findDiseasesWithTranslations(params: DiseaseFilterParams) {
    const { skip, limit, severity, pathogen_type, search } = params;

    const where: Prisma.diseasesWhereInput = {
      ...(severity && { severity }),
      ...(pathogen_type && { pathogen_type }),
      ...(search && {
        OR: [
          { slug: { contains: search, mode: 'insensitive' } },
          { scientific_name: { contains: search, mode: 'insensitive' } },
          {
            disease_translations: {
              some: { disease_name: { contains: search, mode: 'insensitive' } },
            },
          },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      prisma.diseases.count({ where }),
      prisma.diseases.findMany({
        where,
        skip,
        take: limit,
        include: {
          disease_translations: true,
        },
        orderBy: { slug: 'asc' },
      }),
    ]);

    return { total, items };
  }
}

export const diseaseRepository = new DiseaseRepository();
