import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionsInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const queryRunner = this.dataSource.createQueryRunner();
    req.queryRunner = queryRunner;

    return from(queryRunner.connect()).pipe(
      switchMap(() => from(queryRunner.startTransaction())),
      switchMap(() =>
        next.handle().pipe(
          switchMap(async (response) => {
            await queryRunner.commitTransaction();
            return response;
          }),
          catchError((err) =>
            from(
              queryRunner.rollbackTransaction()
                .catch(() => null) // prevent rollback from throwing
                .then(() => throwError(() => err))
            )
          ),
          switchMap((res) =>
            from(
              queryRunner.release().then(() => res)
            )
          ),
          catchError((err) =>
            from(
              queryRunner.release()
                .catch(() => null)
                .then(() => throwError(() => err))
            )
          )
        )
      )
    );
  }
}
