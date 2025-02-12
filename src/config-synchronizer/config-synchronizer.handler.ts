/* eslint-disable prefer-rest-params */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { BaseKafkaHandler } from 'src/utils/base.handler';
import { ConfigService } from '@nestjs/config';
import { SandyLogger } from 'src/utils/sandy.logger';
import KafkaProducerService from 'src/kafka/kafka.producer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TimeUtils } from 'src/utils/time.utils';

@Injectable()
export class ConfigSynchronizerHandler
  extends BaseKafkaHandler
  implements OnModuleInit
{
  static isConfigReady = false;

  constructor(
    configService: ConfigService,
    private readonly kafkaProducer: KafkaProducerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(configService, 'config-synchronizer');
    this.params = arguments;
  }

  async onModuleInit() {
    await this.requestConfiguration();
  }

  async requestConfiguration() {
    if (!ConfigSynchronizerHandler.isConfigReady) {
      await this.kafkaProducer.send({
        topic: 'crawlerConfigRequest',
        message: JSON.stringify({ service: 'PDPParser', request: 'config' }),
      });
      console.warn(
        'PDPParserHandler: No configuration found. Requested configuration from Kafka.',
      );
    }
  }

  public validator(): Promise<void> {
    return Promise.resolve();
  }

  public async process(data: any, logger: SandyLogger): Promise<void> {
    logger.log('ConfigSynchronizer: Updating config.');
    ConfigSynchronizerHandler.isConfigReady = true;
    await this.cacheManager.set('configurations', data.value);
  }

  async waitForConfig(): Promise<void> {
    while (!ConfigSynchronizerHandler.isConfigReady) {
      console.log('ConfigSynchronizer: Waiting for config...');
      await TimeUtils.sleep(1000);
    }
  }

  getTopicNames(): string {
    return `olive-young.pdp-config.update`;
  }

  getGroupId(): string {
    return 'groupId';
  }

  getCount(): number {
    return 1;
  }
}
