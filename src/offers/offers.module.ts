import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { KrotonModule } from './providers/kroton/kroton.module'; 

@Module({
  imports: [PrismaModule, RedisModule, KrotonModule], 
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
