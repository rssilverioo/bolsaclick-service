import { Module } from '@nestjs/common';

import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UnoparController } from './unopar.controller';
import { UnoparService } from './unopar.service';

@Module({
  controllers: [UnoparController],
  providers: [UnoparService, PrismaService, RedisService],
  exports: [UnoparService],
})
export class UnoparModule {}
