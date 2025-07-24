// interceptors/pagination.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const { items, total, page, limit } = data;
        return {
          success: true,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
          data: items,
        };
      }),
    );
  }
}
