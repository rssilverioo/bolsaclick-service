import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { AnhangueraModule } from 'src/partner/anhanguera/anhanguera.module';
import { UnoparModule } from 'src/partner/unopar/unopar.module';

@Module({
  imports: [PrismaModule, RedisModule, AnhangueraModule, UnoparModule],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
