import { Module } from '@nestjs/common';
import appConfig from './config/app.config';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { OliveYoungModule } from './oliveyoung/oliveyoung.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: false,
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    KafkaModule,
    OliveYoungModule,
  ],
})
export class AppModule {}
