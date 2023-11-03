import {
  QueryOptions as MongooseQueryOptions,
  FilterQuery,
  Types,
  Document,
  AnyKeys as MongooseAnyKeys,
  UpdateQuery as MongooseUpdateQuery,
  AggregateOptions,
} from 'mongoose';

export type Pagination = {
  page?: number;
  limit?: number;
};

export type PaginationResult<T> = {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
};

export class BaseEntity {}

export type CrudQueryOptions = {
  throwError?: boolean;
  errorMessage?: string;
  errorTranslationPath?: string;
  pagination?: Pagination;
};

export type WithError = {
  throwError: true;
};

export type WithoutError = {
  throwError: false;
};

export type IsExistsOptions = Pick<CrudQueryOptions, 'errorMessage' | 'throwError'>;
export type FilterOrId<T> = FilterQuery<T> | Types.ObjectId;
export type FindOneOptions = Omit<CrudQueryOptions, 'pagination'> & MongooseQueryOptions;
export type FindManyOptions = CrudQueryOptions & MongooseQueryOptions;
export type UpdateOptions = Omit<CrudQueryOptions, 'pagination'> & MongooseQueryOptions;

export const DEFAULT_OPTIONS: CrudQueryOptions = {
  throwError: false,
};

export interface CrudSignature<T extends Document> {
  findOne(filter: FilterOrId<T>, options?: FindOneOptions & WithError): Promise<T>;
  findOne(filter: FilterOrId<T>, options?: FindOneOptions & WithoutError): Promise<T | null>;
  findOne(filter: FilterOrId<T>, options: WithoutError): Promise<T | null>;

  findMany(
    filter?: FilterQuery<T>,
    options?: FindManyOptions & {
      pagination: Pagination;
    }
  ): Promise<PaginationResult<T>>;
  findMany(filter?: FilterQuery<T>, options?: FindManyOptions & WithError): Promise<T[]>;
  findMany(filter?: FilterQuery<T>, options?: FindManyOptions & WithoutError): Promise<T[]>;

  isExists(filter: FilterQuery<T>, options?: IsExistsOptions & WithError): Promise<true>;
  isExists(filter: FilterQuery<T>, options?: IsExistsOptions & WithoutError): Promise<boolean>;
  isExists(filter: FilterQuery<T>, options: WithoutError): Promise<true | boolean>;

  count(filter: FilterQuery<T>): Promise<number>;

  create(data: MongooseAnyKeys<T>): Promise<T>;
  create(data: MongooseAnyKeys<T>[]): Promise<T[]>;
  create(data: MongooseAnyKeys<T>[] | MongooseAnyKeys<T>): Promise<T[] | T>;

  updateOne(filter: FilterOrId<T>, data: MongooseUpdateQuery<T>, options?: UpdateOptions & WithError): Promise<T>;
  updateOne(
    filter: FilterOrId<T>,
    data: MongooseUpdateQuery<T>,
    options?: UpdateOptions & WithoutError
  ): Promise<T | null>;
  updateOne(filter: FilterOrId<T>, data: MongooseUpdateQuery<T>, options: WithoutError): Promise<T | null>;

  updateMany(filter: FilterQuery<T>, data: MongooseUpdateQuery<T>, options?: UpdateOptions & WithError): Promise<T[]>;
  updateMany(
    filter: FilterQuery<T>,
    data: MongooseUpdateQuery<T>,
    options?: UpdateOptions & WithoutError
  ): Promise<T[] | []>;
  updateMany(filter: FilterQuery<T>, data: MongooseUpdateQuery<T>, options: WithoutError): Promise<T[] | []>;

  deleteOne(filter: FilterOrId<T>, options?: CrudQueryOptions & WithError): Promise<T>;
  deleteOne(filter: FilterOrId<T>, options?: CrudQueryOptions & WithoutError): Promise<T | null>;
  deleteOne(filter: FilterOrId<T>, options: WithoutError): Promise<T | null>;

  deleteMany(filter: FilterQuery<T>, options?: CrudQueryOptions & WithError): Promise<T[]>;
  deleteMany(filter: FilterQuery<T>, options?: CrudQueryOptions & WithoutError): Promise<T[] | []>;
  deleteMany(filter: FilterQuery<T>, options: WithoutError): Promise<T[] | []>;

  aggregation<ReturnedType>(pipelines: any[], options?: AggregateOptions): Promise<ReturnedType[]>;
}
