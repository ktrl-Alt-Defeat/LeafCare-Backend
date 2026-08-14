import { languageRepository } from './language.repository.js';
import { LanguageResponse } from './language.types.js';

export class LanguageService {
  /**
   * Get all active system languages
   */
  async getActiveLanguages(): Promise<LanguageResponse[]> {
    return languageRepository.findActiveLanguages();
  }
}

export const languageService = new LanguageService();
