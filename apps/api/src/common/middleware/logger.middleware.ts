import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Middleware');

  use(req: Request, _res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    this.logger.debug(
      `${method} ${originalUrl} - ${ip} - ${userAgent.substring(0, 50)}`,
    );

    next();
  }
}
