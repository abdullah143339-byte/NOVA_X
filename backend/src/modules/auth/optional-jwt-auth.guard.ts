/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);
    if (result instanceof Promise) {
      return result.then(() => true).catch(() => true);
    }
    return true;
  }

  handleRequest(_err: any, user: any, _info: any) {
    return user || null;
  }
}
