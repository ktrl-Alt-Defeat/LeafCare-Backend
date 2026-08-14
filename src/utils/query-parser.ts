import { PAGINATION_DEFAULTS, SupportedLanguage, SUPPORTED_LANGUAGES } from '../constants/index.js';

export interface ParsedQueryParams {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  lang: SupportedLanguage;
  search?: string;
}

/**
 * Utility to parse pagination, sorting, search, and language preferences from req.query
 */
export const parseQueryParams = (query: Record<string, unknown>): ParsedQueryParams => {
  const rawPage = parseInt(String(query.page || PAGINATION_DEFAULTS.DEFAULT_PAGE), 10);
  const page = isNaN(rawPage) || rawPage < 1 ? PAGINATION_DEFAULTS.DEFAULT_PAGE : rawPage;

  const rawLimit = parseInt(String(query.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT), 10);
  const limit = isNaN(rawLimit) || rawLimit < 1
    ? PAGINATION_DEFAULTS.DEFAULT_LIMIT
    : Math.min(rawLimit, PAGINATION_DEFAULTS.MAX_LIMIT);

  const skip = (page - 1) * limit;

  const sortBy = typeof query.sortBy === 'string' && query.sortBy.trim() ? query.sortBy.trim() : undefined;
  const rawOrder = String(query.sortOrder || '').toLowerCase();
  const sortOrder: 'asc' | 'desc' = rawOrder === 'desc' ? 'desc' : 'asc';

  const rawLang = String(query.lang || '').toLowerCase();
  const lang: SupportedLanguage = (SUPPORTED_LANGUAGES as readonly string[]).includes(rawLang)
    ? (rawLang as SupportedLanguage)
    : PAGINATION_DEFAULTS.DEFAULT_LANGUAGE;

  const rawSearch = typeof query.q === 'string' ? query.q.trim() : typeof query.search === 'string' ? query.search.trim() : undefined;
  const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    lang,
    search,
  };
};
