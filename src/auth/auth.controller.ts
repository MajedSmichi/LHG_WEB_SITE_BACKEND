import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import type { RequestWithUser } from './interfaces/request-with-user.interface.js';
import { Body } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role?: string,
  ) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      return { message: 'Email already exists' };
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(email, passwordHash, role);
    return { id: user.id, email: user.email, role: user.role };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: RequestWithUser): Promise<{ access_token: string }> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Request() req: RequestWithUser): { user: RequestWithUser['user'] } {
    return { user: req.user };
  }
}
