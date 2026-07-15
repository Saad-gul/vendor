import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '@marketverse/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.message : 'Internal server error';
    const stack = exception instanceof Error ? exception.stack : undefined;
    const details = exception instanceof HttpException ? exception.getResponse() : undefined;

    if (status >= 500) {
      this.logger.error(stack || message);
    } else {
      this.logger.warn(message);
    }

    const body: ApiResponse<null> = {
      success: false,
      error: {
        code: `HTTP_${status}`,
        message,
        details: typeof details === 'string' ? { message: details } : details,
      },
    };

    response.status(status).json(body);
  }
}
