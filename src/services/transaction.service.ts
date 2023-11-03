import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';
import { ClsService, UseCls } from 'nestjs-cls';

@Injectable()
export class TransactionService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cls: ClsService,
  ) {}

  getConnection(): Connection {
    return this.connection;
  }

  @UseCls()
  async run<T>(callback: (session: ClientSession) => Promise<T>): Promise<T | undefined> {
    let result: T | undefined;
    let session = this.cls.get('mongoSession');

    try {
      if (!Boolean(session)) {
        session = await this.getConnection().startSession();
        this.cls.set('mongoSession', session);
      }

      await session.withTransaction(async () => {
        result = await callback(session);
      });
    } catch (e) {
      await session.endSession();
      Logger.error('Transaction aborted', e);
      throw e;
    } finally {
      this.cls.set('mongoSession', undefined);
    }

    return result;
  }
}
