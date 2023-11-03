import {
  Model,
  Document,
  FilterQuery,
  Types,
  HydratedDocument,
  UpdateQuery as MongooseUpdateQuery,
  AnyKeys as MongooseAnyKeys,
  QueryWithHelpers,
  AggregateOptions,
} from 'mongoose';

import {
  Pagination,
  CrudQueryOptions,
  PaginationResult,
  WithError,
  WithoutError,
  FindOneOptions,
  FilterOrId,
  FindManyOptions,
  IsExistsOptions,
  UpdateOptions,
  BaseEntity,
  CrudSignature,
  DEFAULT_OPTIONS,
} from '../misc/types';
import { throwErrorCheck } from '../misc/helpers';
import { Inject, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClsService } from 'nestjs-cls';

export function CrudService<T extends Document>(entity: Type<BaseEntity>): Type<CrudSignature<T>> {
  class CrudMixin implements CrudSignature<T> {
    @InjectModel(entity.name) private readonly databaseModel: Model<T>;
    @Inject(ClsService) private readonly cls: ClsService;

    async findOne(filter: FilterOrId<T>, options?: FindOneOptions & WithError): Promise<T>;
    async findOne(filter: FilterOrId<T>, options?: FindOneOptions & WithoutError): Promise<T | null>;
    async findOne(filter: FilterOrId<T>, options: FindOneOptions = DEFAULT_OPTIONS): Promise<T | null> {
      const session = this.cls.get('mongoSession');

      let mongooseQuery: QueryWithHelpers<HydratedDocument<T> | null, HydratedDocument<T>>;

      if (Types.ObjectId.isValid(filter as Types.ObjectId)) {
        mongooseQuery = this.databaseModel.findOne({ _id: filter as Types.ObjectId }, null, options).session(session);
      } else {
        mongooseQuery = this.databaseModel.findOne(filter as FilterQuery<T>, null, options).session(session);
      }

      const queryResult = await mongooseQuery.exec();

      throwErrorCheck(queryResult, options);

      return queryResult;
    }

    async findMany(
      filter?: FilterQuery<T>,
      options?: FindManyOptions & {
        pagination: Pagination;
      },
    ): Promise<PaginationResult<T>>;
    async findMany(filter?: FilterQuery<T>, options?: FindManyOptions & WithError): Promise<T[]>;
    async findMany(filter?: FilterQuery<T>, options?: FindManyOptions & WithoutError): Promise<T[]>;
    async findMany(
      filter?: FilterQuery<T>,
      options: FindManyOptions = DEFAULT_OPTIONS,
    ): Promise<PaginationResult<T> | T[] | []> {
      const session = this.cls.get('mongoSession');

      const mongooseQuery = this.databaseModel.find(filter ?? {}, null, options);

      mongooseQuery.session(session);

      if (options.pagination) {
        const { page, limit } = options.pagination;

        if (page && limit) {
          mongooseQuery.skip((page - 1) * (limit || 0));
          mongooseQuery.limit(limit || 0);
        }

        const queryResult = await mongooseQuery;
        const total = await this.databaseModel.countDocuments(filter ?? {});

        throwErrorCheck(queryResult, options);

        return {
          data: queryResult,
          total,
          totalPages: limit && limit !== 0 ? Math.ceil(total / limit) : 1,
          currentPage: page ? +page : 1,
        };
      }

      const queryResult = await mongooseQuery;

      throwErrorCheck(queryResult, options);

      return queryResult;
    }

    async isExists(filter: FilterQuery<T>, options?: IsExistsOptions & WithError): Promise<true>;
    async isExists(filter: FilterQuery<T>, options?: IsExistsOptions & WithoutError): Promise<boolean>;
    async isExists(filter: FilterQuery<T>, options: IsExistsOptions = DEFAULT_OPTIONS): Promise<true | boolean> {
      const isDocumentExists = await this.databaseModel.exists(filter);
      throwErrorCheck(isDocumentExists, options);

      return Boolean(isDocumentExists);
    }

    async count(filter: FilterQuery<T>): Promise<number> {
      return this.databaseModel.count(filter);
    }

    async create(data: MongooseAnyKeys<T>): Promise<T>;
    async create(data: MongooseAnyKeys<T>[]): Promise<T[]>;
    async create(data: MongooseAnyKeys<T>[] | MongooseAnyKeys<T>): Promise<T[] | T> {
      const session = this.cls.get('mongoSession');

      const [doc] = await this.databaseModel.create([data], { session });

      return doc;
    }

    async updateOne(
      filter: FilterOrId<T>,
      data: MongooseUpdateQuery<T>,
      options?: UpdateOptions & WithError,
    ): Promise<T>;
    async updateOne(
      filter: FilterOrId<T>,
      data: MongooseUpdateQuery<T>,
      options?: UpdateOptions & WithoutError,
    ): Promise<T | null>;
    async updateOne(
      filter: FilterOrId<T>,
      data: MongooseUpdateQuery<T>,
      options: UpdateOptions = DEFAULT_OPTIONS,
    ): Promise<T | null> {
      let updatedDocument: T | null;

      const session = this.cls.get('mongoSession');

      if (Types.ObjectId.isValid(filter as Types.ObjectId)) {
        updatedDocument = await this.databaseModel.findOneAndUpdate(
          { _id: filter as Types.ObjectId },
          data,
          Object.assign(options ?? {}, { new: true, session }),
        );
      } else {
        updatedDocument = await this.databaseModel.findOneAndUpdate(
          filter as FilterQuery<T>,
          data,
          Object.assign(options ?? {}, { new: true, session }),
        );
      }

      throwErrorCheck(updatedDocument, options);

      return updatedDocument;
    }

    async updateMany(
      filter: FilterQuery<T>,
      data: MongooseUpdateQuery<T>,
      options?: UpdateOptions & WithError,
    ): Promise<T[]>;
    async updateMany(
      filter: FilterQuery<T>,
      data: MongooseUpdateQuery<T>,
      options?: UpdateOptions & WithoutError,
    ): Promise<T[] | []>;
    async updateMany(
      filter: FilterQuery<T>,
      data: MongooseUpdateQuery<T>,
      options: UpdateOptions = DEFAULT_OPTIONS,
    ): Promise<T[] | []> {
      const session = this.cls.get('mongoSession');

      const targetDocuments = await this.databaseModel.find(filter).session(session).exec();

      throwErrorCheck(targetDocuments, options);

      if (!targetDocuments.length) {
        return [];
      }

      await this.databaseModel.updateMany(filter, data, Object.assign(options ?? {}, { session }));

      const query = this.databaseModel
        .find({
          _id: { $in: targetDocuments.map((d) => d._id) },
        })
        .session(session);

      return query.exec();
    }

    async deleteOne(filter: FilterOrId<T>, options?: CrudQueryOptions & WithError): Promise<T>;
    async deleteOne(filter: FilterOrId<T>, options?: CrudQueryOptions & WithoutError): Promise<T | null>;
    async deleteOne(filter: FilterOrId<T>, options: CrudQueryOptions = DEFAULT_OPTIONS): Promise<T | null> {
      let targetDocument: T | null;
      const session = this.cls.get('mongoSession');

      if (Types.ObjectId.isValid(filter as Types.ObjectId)) {
        targetDocument = await this.databaseModel.findOne({ _id: filter as Types.ObjectId }, undefined, { session });
      } else {
        targetDocument = await this.databaseModel.findOne(filter as FilterQuery<T>, undefined, { session });
      }

      throwErrorCheck(targetDocument, options);

      if (targetDocument) await this.databaseModel.findOneAndDelete({ _id: targetDocument._id }, { session });

      return targetDocument;
    }

    async deleteMany(filter: FilterQuery<T>, options?: CrudQueryOptions & WithError): Promise<T[]>;
    async deleteMany(filter: FilterQuery<T>, options?: CrudQueryOptions & WithoutError): Promise<T[] | []>;
    async deleteMany(filter: FilterQuery<T>, options: CrudQueryOptions = DEFAULT_OPTIONS): Promise<T[] | []> {
      const session = this.cls.get('mongoSession');

      const targetDocuments = await this.databaseModel.find(filter).session(session).exec();
      throwErrorCheck(targetDocuments, options);

      await this.databaseModel.deleteMany(filter);

      return targetDocuments;
    }

    async aggregation<ReturnedType>(pipelines: any[], options?: AggregateOptions): Promise<ReturnedType[]> {
      const session = this.cls.get('mongoSession');

      const aggQuery = this.databaseModel.aggregate(pipelines, options).session(session);

      return aggQuery.exec();
    }
  }

  return CrudMixin;
}
