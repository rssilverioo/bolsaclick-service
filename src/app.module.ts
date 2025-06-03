import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { AppController } from './app.controller';
import { CourseModule } from './course/course.module';
import { PrismaModule } from './prisma/prisma.module';
import { UniversityModule } from './university/university.module';
import { CityModule } from './city/city.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    CourseModule,
    PrismaModule,
    UniversityModule,
    CityModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
