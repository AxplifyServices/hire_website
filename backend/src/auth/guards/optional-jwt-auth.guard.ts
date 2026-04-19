import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest(err: any, user: any) {
    // Sur les routes "optionnelles", on ne bloque jamais le flux public.
    // Si le token est invalide/expiré, on continue simplement en invité.
    return user ?? null;
  }
}