import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  extractRequestMetadata,
  RequestMetadata,
} from 'src/utils/request-metadata.utils';
import { AppLoggerService } from '../modules/logger/logger.service';

@Injectable()
export class RequestMetadataMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}
  use(req: Request, res: Response, next: NextFunction) {
    const meta = extractRequestMetadata(req);
    // this.logger.logWithMetadata('info', 'Extracted request metadata', meta);
    // attach metadata to the request object for later use in controllers or services
    (req as Request & { metadata: RequestMetadata }).metadata = meta;
    next();
  }
}
