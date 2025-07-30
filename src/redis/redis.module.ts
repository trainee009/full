import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';

import * as redis from 'redis';

@Global()
@Module({

  controllers: [RedisController],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const client = redis.createClient()
        await client.connect();
        return client;
      }
  },
  RedisService,
],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
