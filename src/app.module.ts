import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { AppController } from './app.controller';
import { CourseModule } from './course/course.module';
import { PrismaModule } from './prisma/prisma.module';
import { UniversityModule } from './university/university.module';
import { CityModule } from './city/city.module';
import { AnhangueraModule } from './partner/anhanguera/anhanguera.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OffersModule } from './offers/offers.module';
import { UnoparModule } from './partner/unopar/unopar.module';

import { ShowCaseModule } from './show-case/show-case.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RedisModule,
    CourseModule,
    PrismaModule,
    UniversityModule,
    CityModule,
    AnhangueraModule,
    UnoparModule,
    OffersModule,

    ShowCaseModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
