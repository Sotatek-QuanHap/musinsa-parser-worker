import { Module } from '@nestjs/common';
import { KafkaConsumerService } from 'src/kafka/kafka.consumer';
import { KafkaModule } from 'src/kafka/kafka.module';
import { PDPParserHandler } from './pdp-parser.handler';
import { ConfigModule } from '@nestjs/config';
import { PDPParserService } from './pdp-parser.service';

@Module({
  controllers: [],
  providers: [PDPParserHandler, PDPParserService],
  imports: [ConfigModule, KafkaModule],
})
export class PDPParserModule {
  constructor(
    private kafkaConsumerService: KafkaConsumerService,
    pdpParserHandler: PDPParserHandler,
  ) {
    void this.kafkaConsumerService.listen(pdpParserHandler);
  }
}
