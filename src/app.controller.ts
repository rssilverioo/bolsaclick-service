import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis/redis.service'; 

@Controller()
export class AppController {
  constructor(private readonly redisService: RedisService) {}

@Get('ping-redis')
async ping() {
  const pong = await this.redisService.getClient().ping();
  return { status: pong };
}

}
