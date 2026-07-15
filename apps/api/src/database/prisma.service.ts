import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    const models = Object.keys(this).filter((key) => !key.startsWith('$') && typeof (this as never as Record<string, unknown>)[key] === 'object');
    for (const model of models) {
      try {
        await (this as unknown as Record<string, { deleteMany: () => Promise<unknown> }>)[model].deleteMany();
      } catch {
        // ignore models without deleteMany
      }
    }
  }
}
