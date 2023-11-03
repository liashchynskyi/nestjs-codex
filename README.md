# NestJS CRUD Service with Mongoose

This repository provides a robust CRUD service using NestJS and Mongoose, designed to simplify the development of database interactions with built-in transaction support via Async Local Storage.

## Features

- **CRUD Operations**: Simplify create, read, update, and delete operations using Mongoose.
- **Transaction Management**: Handle transactions smoothly and reliably in your services.
- **Async Local Storage**: Utilize Async Local Storage for context management throughout the life of a request.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed [Node.js](https://nodejs.org/)
- You have a MongoDB server running (local or remote)

## Installation

To install, follow these steps:

```bash
npm install @liashchynskyi/nestjs-codex --save
```

Make sure you have these installed in your NestJS project:

- `"@nestjs/common": ">=8.0.0"`
- `"@nestjs/mongoose": ">=6.5.0-next.3"`
- `"mongoose": ">=6.10.4"`

## Usage

### Import the module

In your `app.module.ts` file add the following module to the `AppModule` imports.

```typescript
CrudModule.forRoot();
```

`forRoot()` method accepts an optional configuration object with the properties of
`ClsModuleOptions` imported from `nestjs-cls` package. The defaults are the following:

```typescript
{
  global: true,
  middleware: {
    mount: true,
    useEnterWith: true,
  },
}
```

> `nestjs-cls` is used to handle transactions. Specifically, it is used to pass `session` object all the way down to the database layer.

### Create a service

For example, let's create a `UserService` that will handle CRUD operations for `User` model.

Define `Mongoose` models.

```typescript
import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = UserEntity & Document;

@Schema({ timestamps: true, autoIndex: true, collection: 'users' })
export class UserEntity {
  @Prop({ required: true })
  name: string;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
```

Use `CrudService` as a base class for your service.

```typescript
import { Injectable } from '@nestjs/common';
import { CrudService } from '@liashchynskyi/nestjs-codex';

@Injectable()
export class UserService extends CrudService<UserDocument>(UserEntity) {
  constructor() {
    super();
  }
}
```

That's it! Now you can use `UserService` with all available methods in your controllers. As simple as that!
No need to write all those CRUD methods yourself.

For example, to create a new user:

```typescript
const user = await this.userService.create({ name: 'John Doe' });
```

### Extend methods

In some use cases you may want to change the default behavior of the service. For example, you may want to
validate input DTO before creating a new document. To do that, you can override the `create` method:

```typescript
import { Injectable } from '@nestjs/common';
import { CrudService } from '@liashchynskyi/nestjs-codex';

@Injectable()
export class UserService extends CrudService<UserDocument>(UserEntity) {
  constructor() {
    super();
  }

  async create(dto: CreateUserDto): Promise<User> {
    await this.validate(dto);

    return super.create(dto); // must call super.create() to create a new document
  }
}
```

## Transactions

Transactions are not applied automatically. You need to wrap critical operations in a transaction manually. To do that,
you should use `TransactionService`. For example, let's extend our `UserService` to create a new user using a transaction:

```typescript
import { Injectable } from '@nestjs/common';
import { CrudService } from '@liashchynskyi/nestjs-codex';
import { TransactionService } from '@liashchynskyi/nestjs-codex';

@Injectable()
export class UserService extends CrudService<UserDocument>(UserEntity) {
  constructor(private readonly transactionService: TransactionService) {
    super();
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.transactionService.run(async (session) => {
      await this.validate(dto);

      return super.create(dto);
    });
  }
}
```

Thanks to `cls` the `session` object will be handled automatically in required CRUD operations of `CrudService`.
In some cases you may want to pass `session` object manually to other methods. That's why it is
the only parameter of the `run` method's callback.

## Available CRUD methods

Available methods are defined in the `CrudSignature` interface.

```typescript
export interface CrudSignature<T extends Document> {
  aggregation<ReturnedType>(pipelines: any[], options?: AggregateOptions): Promise<ReturnedType[]>;

  findOne(filter: FilterOrId<T>, options?: FindOneOptions & WithError): Promise<T>;
  findOne(filter: FilterOrId<T>, options?: FindOneOptions & WithoutError): Promise<T | null>;
  findOne(filter: FilterOrId<T>, options: WithoutError): Promise<T | null>;

  findMany(
    filter?: FilterQuery<T>,
    options?: FindManyOptions & {
      pagination: Pagination;
    },
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
    options?: UpdateOptions & WithoutError,
  ): Promise<T | null>;
  updateOne(filter: FilterOrId<T>, data: MongooseUpdateQuery<T>, options: WithoutError): Promise<T | null>;

  updateMany(filter: FilterQuery<T>, data: MongooseUpdateQuery<T>, options?: UpdateOptions & WithError): Promise<T[]>;
  updateMany(
    filter: FilterQuery<T>,
    data: MongooseUpdateQuery<T>,
    options?: UpdateOptions & WithoutError,
  ): Promise<T[] | []>;
  updateMany(filter: FilterQuery<T>, data: MongooseUpdateQuery<T>, options: WithoutError): Promise<T[] | []>;

  deleteOne(filter: FilterOrId<T>, options?: CrudQueryOptions & WithError): Promise<T>;
  deleteOne(filter: FilterOrId<T>, options?: CrudQueryOptions & WithoutError): Promise<T | null>;
  deleteOne(filter: FilterOrId<T>, options: WithoutError): Promise<T | null>;

  deleteMany(filter: FilterQuery<T>, options?: CrudQueryOptions & WithError): Promise<T[]>;
  deleteMany(filter: FilterQuery<T>, options?: CrudQueryOptions & WithoutError): Promise<T[] | []>;
  deleteMany(filter: FilterQuery<T>, options: WithoutError): Promise<T[] | []>;
}
```

## Contributing

Any contributions are welcomed. Please follow the below guidelines before contributing:

- Fork the repository and create your branch from main.
- Install the dependencies.
- Make sure your code lints.
- Issue that pull request!

## License

Distributed under the MIT License. See LICENSE for more information.

## Contact

Petro Liashchynskyi - [@liashchynskyi](https://twitter.com/liashchynskyi) | [liashchynskyi.net](https://liashchynskyi.net/)
