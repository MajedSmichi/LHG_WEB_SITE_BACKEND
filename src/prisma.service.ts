import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter } as any);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

@Injectable()
export class PrismaService implements OnModuleInit {
  private prismaClient = prisma;

  get user() {
    return (this.prismaClient as any).user;
  }

  get webhelp() {
    return (this.prismaClient as any).webhelp;
  }

  get reservations() {
    return (this.prismaClient as any).reservations;
  }

  get colt_file() {
    return (this.prismaClient as any).colt_file;
  }

  get conversation() {
    return (this.prismaClient as any).conversation;
  }

  get conversationMessage() {
    return (this.prismaClient as any).conversationMessage;
  }

  async onModuleInit() {
    await this.prismaClient.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.prismaClient.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }

  async $connect() {
    return this.prismaClient.$connect();
  }

  async $disconnect() {
    return this.prismaClient.$disconnect();
  }

  $on(eventType: string, callback: (event: unknown) => void) {
    return this.prismaClient.$on(eventType as never, callback);
  }

  $queryRawUnsafe(query: string, ...values: any[]) {
    return (this.prismaClient as any).$queryRawUnsafe(query, ...values);
  }
}