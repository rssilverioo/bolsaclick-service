import { Module } from '@nestjs/common';

import { RedisModule } from 'src/redis/redis.module'; 
import { ShowcaseService } from './show-case.service';
import { ShowcaseController} from './show-case.controller';

@Module({
  imports: [RedisModule],
  controllers: [ShowcaseController],
  providers: [ShowcaseService],
})
export class ShowCaseModule {}
