import { Module } from '@nestjs/common';
import { OffersAnhangueraService } from './offers.service';
import { OffersAnhangueraController } from './offers.controller';
import { RedisService } from 'src/redis/redis.service';

@Module({
  controllers: [OffersAnhangueraController],
  providers: [OffersAnhangueraService, RedisService],
})
export class OffersAnhangueraModule {}
