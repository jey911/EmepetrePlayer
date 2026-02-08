import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje = 'Error interno del servidor';
    let detalles: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const respuesta = exception.getResponse();
      if (typeof respuesta === 'string') {
        mensaje = respuesta;
      } else if (typeof respuesta === 'object' && respuesta !== null) {
        const resp = respuesta as Record<string, unknown>;
        mensaje = (resp.message as string) || mensaje;
        detalles = resp.error;
      }
    } else if (exception instanceof Error) {
      mensaje = exception.message;
      this.logger.error(
        `Error no controlado: ${exception.message}`,
        exception.stack,
      );
    }

    const cuerpoError = {
      codigoEstado: status,
      mensaje,
      detalles,
      timestamp: new Date().toISOString(),
      ruta: request.url,
      metodo: request.method,
    };

    this.logger.warn(
      `[${request.method}] ${request.url} -> ${status}: ${mensaje}`,
    );

    response.status(status).json(cuerpoError);
  }
}
