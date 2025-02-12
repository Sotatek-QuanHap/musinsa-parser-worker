import { Module } from '@nestjs/common';
import { PDPParserModule } from './pdp-parser/pdp-parser.module';

@Module({
  imports: [PDPParserModule],
  providers: [],
  exports: [PDPParserModule],
})
export class OliveYoungModule {}
