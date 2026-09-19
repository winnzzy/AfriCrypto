import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService, UserProfileDto } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SocialAuthDto } from './dto/social-auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const PASSWORD_SALT_ROUNDS = 10;
const REFRESH_TOKEN_HASH_ROUNDS = 10;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
  ) {}

  async signup(dto: SignupDto): Promise<TokenPair & { profile: UserProfileDto }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    // No display name is collected at signup; derive a starting username
    // from the email so profile fields are never blank. The user can
    // change it any time via PATCH /users/me.
    const username = dto.email.split('@')[0];

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        username,
        country: dto.country,
        avatarInitial: username.charAt(0).toUpperCase(),
      },
    });

    await this.walletsService.ensureDefaultWallet(user.id, user.country);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<TokenPair & { profile: UserProfileDto }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.passwordHash) throw new UnauthorizedException('This account uses social sign-in');
    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(user);
  }

  async social(dto: SocialAuthDto): Promise<TokenPair & { profile: UserProfileDto }> {
    const identity = await this.verifySocialIdentity(dto);
    const existingSocial = await this.prisma.socialAccount.findUnique({
      where: { provider_providerAccountId: { provider: dto.provider, providerAccountId: identity.id } },
      include: { user: true },
    });
    if (existingSocial) return this.buildAuthResponse(existingSocial.user);

    if (!identity.email || !identity.emailVerified) {
      throw new UnauthorizedException('The social provider did not return a verified email address');
    }

    let user = await this.prisma.user.findUnique({ where: { email: identity.email } });
    if (!user) {
      if (!dto.country) throw new ConflictException('Country is required when creating a new social account');
      const username = identity.email.split('@')[0];
      user = await this.prisma.user.create({
        data: { email: identity.email, passwordHash: null, username, country: dto.country, isVerified: true, avatarInitial: username.charAt(0).toUpperCase() },
      });
      await this.walletsService.ensureDefaultWallet(user.id, user.country);
    }

    await this.prisma.socialAccount.create({
      data: { userId: user.id, provider: dto.provider, providerAccountId: identity.id, email: identity.email },
    });
    return this.buildAuthResponse(user);
  }

  private async verifySocialIdentity(dto: SocialAuthDto): Promise<{ id: string; email?: string; emailVerified: boolean }> {
    if (dto.provider === 'google') {
      const clientId = this.config.get<string>('social.googleClientId');
      if (!clientId) throw new UnauthorizedException('Google sign-in is not configured');
      const res = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(dto.credential));
      if (!res.ok) throw new UnauthorizedException('Invalid Google credential');
      const claims = await res.json() as any;
      if (claims.aud !== clientId || !claims.sub) throw new UnauthorizedException('Invalid Google credential');
      return { id: claims.sub, email: claims.email, emailVerified: claims.email_verified === 'true' || claims.email_verified === true };
    }

    if (dto.provider === 'facebook') {
      const appId = this.config.get<string>('social.facebookAppId');
      const appSecret = this.config.get<string>('social.facebookAppSecret');
      if (!appId || !appSecret) throw new UnauthorizedException('Facebook sign-in is not configured');
      const debug = await fetch('https://graph.facebook.com/debug_token?input_token=' + encodeURIComponent(dto.credential) + '&access_token=' + encodeURIComponent(appId + '|' + appSecret));
      const debugBody = await debug.json() as any;
      if (!debug.ok || !debugBody?.data?.is_valid || debugBody.data.app_id !== appId) throw new UnauthorizedException('Invalid Facebook credential');
      const profile = await fetch('https://graph.facebook.com/me?fields=id,email&access_token=' + encodeURIComponent(dto.credential));
      const claims = await profile.json() as any;
      if (!profile.ok || !claims.id) throw new UnauthorizedException('Invalid Facebook credential');
      return { id: claims.id, email: claims.email, emailVerified: !!claims.email };
    }

    // Apple identity tokens require signature/JWKS verification. Fail closed until
    // that verifier is configured rather than accepting an unverified JWT.
    throw new UnauthorizedException('Apple sign-in verification is not configured yet');
  }

  async refresh(dto: RefreshTokenDto): Promise<TokenPair> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!stored || stored.userId !== payload.sub || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenMatches = await bcrypt.compare(dto.refreshToken, stored.tokenHash);
    if (!tokenMatches) {
      // The jti was valid but the token body wasn't — a strong signal the
      // stored hash and an attacker-presented token disagree (e.g. a
      // leaked/replayed token line). Revoke every active session for this
      // user rather than just this one.
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: the consumed token can never be replayed again.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(stored.userId);
    return this.issueTokenPair(user);
  }

  private async buildAuthResponse(user: User): Promise<TokenPair & { profile: UserProfileDto }> {
    const tokens = await this.issueTokenPair(user);
    const profile = this.usersService.toProfile(user);
    return { ...tokens, profile };
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const payload: JwtPayload = { sub: user.id, email: user.email, country: user.country };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });

    const jti = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti } as RefreshTokenPayload,
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
      },
    );

    const { exp } = this.jwtService.decode(refreshToken) as { exp: number };
    const tokenHash = await bcrypt.hash(refreshToken, REFRESH_TOKEN_HASH_ROUNDS);
    await this.prisma.refreshToken.create({
      data: { id: jti, userId: user.id, tokenHash, expiresAt: new Date(exp * 1000) },
    });

    return { accessToken, refreshToken };
  }
}
