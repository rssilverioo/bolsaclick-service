import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined in the environment variables');
    }

    this.redis = new Redis(redisUrl, {
      tls: {} // Ativa TLS para conexão segura
    });
  }

  getClient(): Redis {
    return this.redis;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
