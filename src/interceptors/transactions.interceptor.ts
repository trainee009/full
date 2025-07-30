import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { catchError, finalize, from, Observable, switchMap, tap } from "rxjs";
import { DataSource } from "typeorm";

@Injectable()
export class TransactionsInterceptor implements NestInterceptor {
    constructor(private readonly dataSource: DataSource) {}

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();

        const queryRunner = this.dataSource.createQueryRunner();

        req.queryRunner = queryRunner;

        return from(queryRunner.connect()).pipe(
            switchMap(() => from(queryRunner.startTransaction())),
            switchMap(() =>
                next.handle().pipe(
                    tap(async () => await queryRunner.commitTransaction()),
                    catchError(async (err) => {
                        await queryRunner.rollbackTransaction();
                        throw err;
                    }),
                    tap({
                        finalize: async () => {
                            await queryRunner.release();
                        }
                    })
                )
            )
        )
    }
}