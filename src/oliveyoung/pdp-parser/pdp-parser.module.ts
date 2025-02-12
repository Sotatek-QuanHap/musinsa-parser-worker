import { Module, OnModuleInit } from '@nestjs/common';
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
export class PDPParserModule implements OnModuleInit {
  constructor(
    private readonly kafkaConsumerService: KafkaConsumerService,
    private readonly pdpParserHandler: PDPParserHandler, // Let NestJS inject this
  ) {}

  onModuleInit() {
    // Use the PDPParserHandler only after the module is fully initialized
    void this.kafkaConsumerService.listen(this.pdpParserHandler);
  }
}
