import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Ne PAS wrapper :
        // - déjà un objet avec 'data' ou 'meta' (réponses paginées)
        // - un Buffer (binaire brut)
        // - un StreamableFile (fichier à streamer)
        if (
          data &&
          typeof data === 'object' &&
          ('data' in data ||
            'meta' in data ||
            data instanceof Buffer ||
            data instanceof StreamableFile)
        ) {
          return data;
        }
        return { data, timestamp: new Date().toISOString() };
      }),
    );
  }
}
