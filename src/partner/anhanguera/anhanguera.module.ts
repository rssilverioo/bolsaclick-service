import { Module } from '@nestjs/common';
import { AnhangueraService } from './anhanguera.service';
import { AnhangueraController } from './anhanguera.controller';
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [AnhangueraController],
  providers: [AnhangueraService, PrismaService, RedisService],
})
export class AnhangueraModule {}
