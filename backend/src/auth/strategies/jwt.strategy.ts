import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Access-token payload. Country travels with the token (not just the DB
// record) because the frontend branches on it for currency/payment-method
// display without a round trip to /users/me.
export interface JwtPayload {
  sub: string;
  email: string;
  country: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  country: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Access tokens only — refresh tokens are signed with a separate
      // secret (jwt.refreshSecret) and verified explicitly in
      // AuthService.refresh, precisely so they can't double as access
      // tokens here.
      secretOrKey: config.get<string>('jwt.secret')!,
    });
  }

  // Whatever is returned here becomes `req.user`.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return { userId: payload.sub, email: payload.email, country: payload.country };
  }
}
