import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: connectionString,
    }),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

@Injectable()
export class PrismaService implements OnModuleInit {
  private prismaClient = prisma;

  get user() {
    return this.prismaClient.user;
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
}
