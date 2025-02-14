/* eslint-disable prefer-rest-params */
import { Inject, Injectable } from '@nestjs/common';
import { BaseKafkaHandler } from 'src/utils/base.handler';
import { PLPParserService } from './plp-parser.service';
import { ConfigService } from '@nestjs/config';
import KafkaProducerService from 'src/kafka/kafka.producer';
import { KafkaTopics, PLPParserConfigs } from '../constants';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CachedConfigurations } from '../../config-synchronizer/constants';
import { Cache } from 'cache-manager';

@Injectable()
export class PLPParserHandler extends BaseKafkaHandler {
  constructor(
    configService: ConfigService,
    private readonly parserService: PLPParserService,
    private readonly kafkaProducer: KafkaProducerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(configService, PLPParserConfigs.name);
    this.params = arguments;
  }

  public validator(): Promise<void> {
    return Promise.resolve();
  }

  public async process(data: any): Promise<void> {
    const allConfigurations = (await this.cacheManager.get(
      'configurations',
    )) as CachedConfigurations;
    const plpConfigs = allConfigurations.PLPParser;
    const parsedData = this.parserService.parse(data.html, plpConfigs);

    // Send parsed data to Kafka
    await this.kafkaProducer.send({
      topic: KafkaTopics.plpResult,
      message: JSON.stringify({
        categoryId: data.categoryId,
        productList: parsedData,
      }),
    });
  }

  getTopicNames(): string {
    return KafkaTopics.plpParserRequest;
  }

  getGroupId(): string {
    return PLPParserConfigs.groupId;
  }

  getCount(): number {
    return this.configService.get('app.oliveYoung.numberOfPlpParsers', 0, {
      infer: true,
    });
  }
}
