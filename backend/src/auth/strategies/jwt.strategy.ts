import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    // @ts-ignore - configService is used in super() call
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'jwt_secret_key'),
      issuer:
        configService.get<string>('KEYCLOAK_URL') +
        '/realms/' +
        configService.get<string>('KEYCLOAK_REALM'),
      algorithms: ['RS256', 'HS256'],
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Validate and enrich user data
    const user = await this.authService.validateUser(payload);

    if (!user) {
      throw new UnauthorizedException('User validation failed');
    }

    return user;
  }
}
