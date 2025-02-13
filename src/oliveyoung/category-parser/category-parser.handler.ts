/* eslint-disable prefer-rest-params */
import { Inject, Injectable } from '@nestjs/common';
import { BaseKafkaHandler } from 'src/utils/base.handler';
import { CategoryParserService } from './category-parser.service';
import { ConfigService } from '@nestjs/config';
import { SandyLogger } from 'src/utils/sandy.logger';
import KafkaProducerService from 'src/kafka/kafka.producer';
import { CategoryParserConfigs, KafkaTopics } from '../constants';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CachedConfigurations } from '../../config-synchronizer/constants';

@Injectable()
export class CategoryParserHandler extends BaseKafkaHandler {
  constructor(
    configService: ConfigService,
    private readonly parserService: CategoryParserService,
    private readonly kafkaProducer: KafkaProducerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(configService, CategoryParserConfigs.name);
    this.params = arguments;
  }

  public validator(): Promise<void> {
    return Promise.resolve();
  }

  public async process(data: any, logger: SandyLogger): Promise<void> {
    const allConfigurations = (await this.cacheManager.get(
      'configurations',
    )) as CachedConfigurations;
    const categoryConfigs = allConfigurations.CategoryParser;

    const parsedCategory = this.parserService.parse(data.html, categoryConfigs);

    // Send to Kafka for parsing
    await this.kafkaProducer.send({
      topic: KafkaTopics.categoryResult,
      message: JSON.stringify(parsedCategory),
    });
    logger.log('Successfully processed parser request.');
  }

  getTopicNames(): string {
    return KafkaTopics.categoryParserRequest;
  }

  getGroupId(): string {
    return CategoryParserConfigs.groupId;
  }

  getCount(): number {
    return this.configService.get('app.oliveYoung.numberOfCategoryParsers', 0, {
      infer: true,
    });
  }
}
