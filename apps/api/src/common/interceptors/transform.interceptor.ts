import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown> | null;
  error: null;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // If the handler already returned an object with a `data` key,
        // treat it as a pre-formed envelope and normalise it.
        if (
          responseData &&
          typeof responseData === 'object' &&
          'data' in responseData
        ) {
          const obj = responseData as Record<string, unknown>;
          return {
            data: obj.data,
            meta: (obj.meta as Record<string, unknown>) ?? null,
            error: null,
          } as ApiResponse<T>;
        }

        // Otherwise wrap the raw response
        return {
          data: responseData,
          meta: null,
          error: null,
        } as ApiResponse<T>;
      }),
    );
  }
}
