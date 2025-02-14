import { Module, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from 'src/kafka/kafka.consumer';
import { KafkaModule } from 'src/kafka/kafka.module';
import { PLPParserHandler } from './plp-parser.handler';
import { ConfigModule } from '@nestjs/config';
import { PLPParserService } from './plp-parser.service';
import { ConfigSynchronizerHandler } from '../../config-synchronizer/config-synchronizer.handler';
import { ConfigSynchronizerModule } from '../../config-synchronizer/config-synchronizer.module';

@Module({
  controllers: [],
  providers: [PLPParserHandler, PLPParserService],
  imports: [ConfigModule, KafkaModule, ConfigSynchronizerModule],
})
export class PLPParserModule implements OnModuleInit {
  constructor(
    private kafkaConsumerService: KafkaConsumerService,
    private readonly configSynchronizerHandler: ConfigSynchronizerHandler,
    private readonly plpParserHandler: PLPParserHandler,
  ) {}
  async onModuleInit() {
    // Use the PDPParserHandler only after configurations is ready
    await this.configSynchronizerHandler.waitForConfig();
    void this.kafkaConsumerService.listen(this.plpParserHandler);
  }
}
