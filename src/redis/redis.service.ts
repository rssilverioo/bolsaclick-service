/* eslint-disable prettier/prettier */
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

    const isSecure = redisUrl.startsWith('rediss://');

    this.redis = new Redis(redisUrl, isSecure ? { tls: {} } : {});
  }

  getClient(): Redis {
    return this.redis;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
