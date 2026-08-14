import { prisma } from '../config/database.js';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Generic Base Repository Abstraction
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  /**
   * Returns the Prisma model delegate
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected get model(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma as any)[this.modelName];
  }

  /**
   * Find record by unique ID
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  /**
   * Find many records with pagination and filtering
   */
  async findMany(
    args: Record<string, unknown> = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 10));
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.model.count({ where: args.where }),
      this.model.findMany({
        ...args,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput): Promise<T> {
    return this.model.create({
      data,
    });
  }

  /**
   * Update an existing record by ID
   */
  async update(id: string, data: UpdateInput): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a record by ID (Hard delete)
   */
  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }

  /**
   * Soft delete a record by ID (sets deleted_at = now()).
   *
   * Only valid for models that actually declare `deleted_at`: users,
   * prediction_history, posts, comments and products. Calling it on any other
   * model throws a Prisma validation error at runtime — the delegate is typed
   * `any`, so TypeScript cannot catch the mistake for you.
   */
  async softDelete(id: string): Promise<T> {
    return this.model.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  /**
   * Count records matching filter conditions
   */
  async count(where: Record<string, unknown> = {}): Promise<number> {
    return this.model.count({ where });
  }
}
