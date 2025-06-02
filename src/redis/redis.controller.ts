import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('ping-redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get()
  async ping(): Promise<{ status: string }> {
    const pong = await this.redisService.getClient().ping();
    return { status: pong };
  }
}
