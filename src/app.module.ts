import { Module } from '@nestjs/common';
import appConfig from './config/app.config';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { PDPParserModule as OliveYoungPDPParserModule } from './olive-young-pdp-parser/pdp-parser.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: false,
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),
    KafkaModule,
    OliveYoungPDPParserModule,
  ],
})
export class AppModule {}
