import { languages, Prisma } from '@prisma/client';
import { BaseRepository } from '../../repositories/base.repository.js';
import { prisma } from '../../config/database.js';

export class LanguageRepository extends BaseRepository<
  languages,
  Prisma.languagesCreateInput,
  Prisma.languagesUpdateInput
> {
  constructor() {
    super('languages');
  }

  /**
   * Fetch active languages sorted by sort_order
   */
  async findActiveLanguages(): Promise<languages[]> {
    return prisma.languages.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });
  }
}

export const languageRepository = new LanguageRepository();
