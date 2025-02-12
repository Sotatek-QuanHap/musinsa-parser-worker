import { Module, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from 'src/kafka/kafka.consumer';
import { KafkaModule } from 'src/kafka/kafka.module';
import { PDPParserHandler } from './pdp-parser.handler';
import { ConfigModule } from '@nestjs/config';
import { PDPParserService } from './pdp-parser.service';
import { ConfigSynchronizerModule } from 'src/config-synchronizer/config-synchronizer.module';
import { ConfigSynchronizerHandler } from 'src/config-synchronizer/config-synchronizer.handler';

@Module({
  controllers: [],
  providers: [PDPParserHandler, PDPParserService],
  imports: [ConfigModule, KafkaModule, ConfigSynchronizerModule],
})
export class PDPParserModule implements OnModuleInit {
  constructor(
    private readonly kafkaConsumerService: KafkaConsumerService,
    private readonly configSynchronizerHandler: ConfigSynchronizerHandler,
    private readonly pdpParserHandler: PDPParserHandler,
  ) {}

  async onModuleInit() {
    // Use the PDPParserHandler only after configurations is ready
    await this.configSynchronizerHandler.waitForConfig();
    void this.kafkaConsumerService.listen(this.pdpParserHandler);
  }
}
