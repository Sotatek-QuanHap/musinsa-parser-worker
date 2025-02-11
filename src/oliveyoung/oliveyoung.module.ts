import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/kafka/kafka.module';
import { PDPParserModule } from './pdp-parser/pdp-parser.module';

@Module({
  imports: [KafkaModule, PDPParserModule],
  providers: [],
  exports: [],
})
export class OliveYoungModule {}
