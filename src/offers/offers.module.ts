import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { AnhangueraModule } from 'src/partner/anhanguera/anhanguera.module';

@Module({
  imports: [PrismaModule, RedisModule, AnhangueraModule],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
