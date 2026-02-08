import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const inicio = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duracion = Date.now() - inicio;
          this.logger.log(
            `${method} ${url} ${response.statusCode} - ${duracion}ms`,
          );
        },
        error: (error: Error) => {
          const duracion = Date.now() - inicio;
          this.logger.error(
            `${method} ${url} ERROR - ${duracion}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
