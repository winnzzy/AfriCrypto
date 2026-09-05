import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marks a route (or whole controller) as exempt from the global JwtAuthGuard
// — see AppModule (APP_GUARD) and JwtAuthGuard.canActivate.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
