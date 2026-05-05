import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { AuthUser } from './interfaces/auth-user.interface.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthUser> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role as 'admin' | 'user',
    };
  }

  async login(user: AuthUser): Promise<{ access_token: string }> {
    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
