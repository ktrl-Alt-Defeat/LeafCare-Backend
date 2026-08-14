import { languages } from '@prisma/client';

export type LanguageResponse = languages;

export interface LanguageListResponse {
  languages: LanguageResponse[];
  total: number;
}
