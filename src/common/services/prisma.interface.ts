import AppError from '../errors/app.error';

export interface IPrismaTransactionResult<T = null> {
  success: boolean;
  data?: T;
  error?: AppError;
  code?: string;
  message?: string;
}
