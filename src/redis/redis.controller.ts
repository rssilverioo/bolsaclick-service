import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get('ping')
  async ping() {
    const pong = await this.redisService.getClient().ping();
    return { status: pong };
  }
}
