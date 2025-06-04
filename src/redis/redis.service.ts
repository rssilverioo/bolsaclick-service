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

  async set(key: string, value: unknown, ttlInSeconds = 60 * 60 * 24 * 7): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }
  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      console.log(`🧹 ${keys.length} chaves removidas com padrão "${pattern}"`);
    } else {
      console.log(`ℹ️ Nenhuma chave encontrada para o padrão "${pattern}"`);
    }
  }
  async onModuleDestroy() {
    await this.redis.quit();
  }
}
