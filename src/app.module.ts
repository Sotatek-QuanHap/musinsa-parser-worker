import { Module } from '@nestjs/common';
import appConfig from './config/app.config';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { ConsumerTestModule } from './consumer-test/consumer-test.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: false,
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),
    KafkaModule,
    ConsumerTestModule,
  ],
})
export class AppModule {}
