import { Module } from '@nestjs/common';
import { PDPParserModule } from './pdp-parser/pdp-parser.module';
import { PLPParserModule } from './plp-parser/plp-parser.module';
import { KafkaModule } from '../kafka/kafka.module';
import { CategoryParserModule } from './category-parser/category-parser.module';

@Module({
  imports: [
    KafkaModule,
    PDPParserModule,
    PLPParserModule,
    CategoryParserModule,
  ],
  providers: [],
  exports: [PDPParserModule, CategoryParserModule],
})
export class OliveYoungModule {}
