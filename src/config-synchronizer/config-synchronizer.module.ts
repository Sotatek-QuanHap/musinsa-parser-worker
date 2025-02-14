import { Module, OnModuleInit } from '@nestjs/common';
import { KafkaModule } from 'src/kafka/kafka.module';
import { ConfigSynchronizerHandler } from './config-synchronizer.handler';
import { KafkaConsumerService } from 'src/kafka/kafka.consumer';

@Module({
  imports: [KafkaModule],
  providers: [ConfigSynchronizerHandler],
  exports: [ConfigSynchronizerHandler],
})
export class ConfigSynchronizerModule implements OnModuleInit {
  constructor(
    private readonly kafkaConsumerService: KafkaConsumerService,
    private readonly configSynchronizerHandler: ConfigSynchronizerHandler,
  ) {}

  onModuleInit() {
    void this.kafkaConsumerService.listen(this.configSynchronizerHandler);
    console.log('ConfigSynchronizer: Requesting configuration...');
  }
}
