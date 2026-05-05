import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../interfaces/auth-user.interface.js';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev_secret_change_me',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
