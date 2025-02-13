import { Module } from '@nestjs/common';
import { KafkaConsumerService } from 'src/kafka/kafka.consumer';
import { KafkaModule } from 'src/kafka/kafka.module';
import { PLPParserHandler } from './plp-parser.handler';
import { ConfigModule } from '@nestjs/config';
import { PLPParserService } from './plp-parser.service';

@Module({
  controllers: [],
  providers: [PLPParserHandler, PLPParserService],
  imports: [ConfigModule, KafkaModule],
})
export class PLPParserModule {
  constructor(
    private kafkaConsumerService: KafkaConsumerService,
    plpParserHandler: PLPParserHandler,
  ) {
    void this.kafkaConsumerService.listen(plpParserHandler);
  }
}
