import { Module } from '@nestjs/common';
import { PDPParserModule } from './pdp-parser/pdp-parser.module';
import { PLPParserModule } from './plp-parser/plp-parser.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule, PDPParserModule, PLPParserModule],
  providers: [],
  exports: [PDPParserModule],
})
export class OliveYoungModule {}
