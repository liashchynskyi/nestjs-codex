import { DynamicModule, Global, Module } from '@nestjs/common';
import { TransactionService } from './services/transaction.service';
import { ClsModule, ClsModuleOptions } from 'nestjs-cls';

const defaultOptions = {
  global: true,
  middleware: {
    mount: true,
    useEnterWith: true,
  },
};

@Global()
@Module({})
export class CrudModule {
  static forRoot(options: ClsModuleOptions = defaultOptions): DynamicModule {
    return {
      module: CrudModule,
      imports: [ClsModule.forRoot(options)],
      providers: [TransactionService],
      exports: [TransactionService],
    };
  }
}
