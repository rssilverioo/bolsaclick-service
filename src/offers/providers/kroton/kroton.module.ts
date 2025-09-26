import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { KrotonService } from './kroton.service';

@Module({
  providers: [KrotonService, PrismaService, RedisService],
  exports: [KrotonService],
})
export class KrotonModule {}
