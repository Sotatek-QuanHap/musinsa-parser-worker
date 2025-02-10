import { Module } from '@nestjs/common';
import { ConsumerTestHandler } from './test.handler';
import { KafkaConsumerService } from '../kafka/kafka.consumer';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  controllers: [],
  providers: [ConsumerTestHandler],
  imports: [KafkaModule],
})
export class ConsumerTestModule {
  constructor(
    private kafkaConsumerService: KafkaConsumerService,
    consumerTestHandler: ConsumerTestHandler,
  ) {
    void this.kafkaConsumerService.listen(consumerTestHandler);
  }
}
