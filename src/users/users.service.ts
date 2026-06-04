import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { User } from '../generated/prisma/client.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly protectedEmail = 'smichimajed@gmail.com';

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(email: string, passwordHash: string, role: string = 'user'): Promise<User> {
    return this.prisma.user.create({
      data: { email, passwordHash, role },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async deleteById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (user.email.trim().toLowerCase() === this.protectedEmail) {
      throw new ForbiddenException('Ce compte ne peut pas être supprimé');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
