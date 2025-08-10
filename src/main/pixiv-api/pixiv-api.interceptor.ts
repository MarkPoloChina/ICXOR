// handle-error.interceptor.ts
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'

import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { catchError, from } from 'rxjs'

@Injectable()
export class HandleErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return from(next.handle()).pipe(
      catchError((err) => {
        if (err instanceof HttpException) {
          throw err
        }

        if (err?.response !== undefined && err.response.status === 404) {
          throw new HttpException(
            '[NRT] pid not found',
            HttpStatus.NOT_FOUND,
          )
        }

        throw err
      }),
    )
  }
}
