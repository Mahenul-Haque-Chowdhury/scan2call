import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  data: null;
  error: {
    code: number;
    message: string;
    details: unknown;
    requestId?: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    let status: number;
    let message: string;
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, unknown>;
        const responseMessage = res.message;
        message =
          typeof responseMessage === 'string'
            ? responseMessage
            : exception.message;
        details = res.errors ?? res.details ?? null;

        // class-validator returns message as an array
        if (Array.isArray(responseMessage)) {
          details = responseMessage;
          message = 'Validation failed';
        }
      } else {
        message = exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      // Log full error for non-HTTP exceptions
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorResponse: ErrorResponse = {
      data: null,
      error: {
        code: status,
        message,
        details,
      },
    };

    // Attach request ID if available (set by correlation-id middleware)
    if (request.id) {
      errorResponse.error.requestId = request.id;
    }

    response.status(status).json(errorResponse);
  }
}
