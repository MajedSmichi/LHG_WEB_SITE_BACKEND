import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { AuthUser } from './interfaces/auth-user.interface.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('Email non trouvé');
    }

    // Générer un token JWT avec expiration 15 minutes
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' }
    );

    // Envoyer l'email
    await this.mailService.sendResetPasswordEmail(email, resetToken);

    return { message: 'Email de réinitialisation envoyé' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères');
    }

    try {
      // Vérifier le token JWT
      const payload = this.jwtService.verify(token);
      
      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Mettre à jour le mot de passe
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash: hashedPassword }
      });

      return { message: 'Mot de passe réinitialisé avec succès' };
    } catch (error) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}
