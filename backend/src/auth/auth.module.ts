import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import {
  KeycloakConnectModule,
  KeycloakConnectOptions,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthDemoController } from './auth-demo.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { CombinedAuthGuard } from './guards/combined-auth.guard';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<KeycloakConnectOptions> => ({
        authServerUrl: configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080'),
        realm: configService.get<string>('KEYCLOAK_REALM', 'mes'),
        clientId: configService.get<string>('KEYCLOAK_CLIENT_ID', 'backend'),
        secret: configService.get<string>('KEYCLOAK_CLIENT_SECRET', 'backend-secret'),
        policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
        tokenValidation: TokenValidation.ONLINE,
        useNestLogger: true,
        logLevels: configService.get('NODE_ENV') === 'development' ? ['verbose'] : ['error'],
      }),
    }),
    PermissionsModule,
  ],
  controllers: [AuthController, AuthDemoController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshStrategy,
    JwtAccessGuard,
    JwtRefreshGuard,
    RolesGuard,
    PermissionsGuard,
    CombinedAuthGuard,
  ],
  exports: [
    AuthService,
    JwtAccessGuard,
    JwtRefreshGuard,
    RolesGuard,
    PermissionsGuard,
    CombinedAuthGuard,
    KeycloakConnectModule,
  ],
})
export class AuthModule {}