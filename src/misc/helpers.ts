import { CrudQueryOptions } from './types';

export const throwErrorCheck = (queryResult: any | any[], options: CrudQueryOptions) => {
  const isResultExists = Array.isArray(queryResult) ? !!queryResult.length : !!queryResult;

  if (options.throwError && !isResultExists) {
    throw new Error(options.errorMessage || 'Document not found');
  }
};
