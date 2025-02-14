import { Module, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from 'src/kafka/kafka.consumer';
import { KafkaModule } from 'src/kafka/kafka.module';
import { CategoryParserHandler } from './category-parser.handler';
import { ConfigModule } from '@nestjs/config';
import { CategoryParserService } from './category-parser.service';
import { ConfigSynchronizerHandler } from '../../config-synchronizer/config-synchronizer.handler';
import { ConfigSynchronizerModule } from '../../config-synchronizer/config-synchronizer.module';

@Module({
  controllers: [],
  providers: [CategoryParserHandler, CategoryParserService],
  imports: [ConfigModule, KafkaModule, ConfigSynchronizerModule],
})
export class CategoryParserModule implements OnModuleInit {
  constructor(
    private readonly kafkaConsumerService: KafkaConsumerService,
    private readonly configSynchronizerHandler: ConfigSynchronizerHandler,
    private readonly categoryParserHandler: CategoryParserHandler,
  ) {}

  async onModuleInit() {
    // Use the PDPParserHandler only after configurations is ready
    await this.configSynchronizerHandler.waitForConfig();
    void this.kafkaConsumerService.listen(this.categoryParserHandler);
  }
}
