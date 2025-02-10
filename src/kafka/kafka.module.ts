import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { KafkaConsumer } from './kafka.consumer';
import KafkaProducerService from './kafka.producer';
import { KafkaConsumerService } from './kafka.consumer';

@Module({
  imports: [],
  controllers: [],
  providers: [ConfigService, KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {
  constructor(private kafkaProducer: KafkaProducerService) {
    // void this.kafkaProducer.start();
  }
}
