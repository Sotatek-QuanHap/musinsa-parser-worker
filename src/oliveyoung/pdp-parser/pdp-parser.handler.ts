/* eslint-disable prefer-rest-params */
import { Inject, Injectable } from '@nestjs/common';
import { BaseKafkaHandler } from 'src/utils/base.handler';
import { PDPParserService } from './pdp-parser.service';
import { ConfigService } from '@nestjs/config';
import { SandyLogger } from 'src/utils/sandy.logger';
import KafkaProducerService from 'src/kafka/kafka.producer';
import {
  KafkaTopics,
  ParsingConfigurations,
  PDPParserConfigs,
} from '../constants';
import { ParserRequestPayload } from './types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CachedConfigurations } from 'src/config-synchronizer/constants';

@Injectable()
export class PDPParserHandler extends BaseKafkaHandler {
  constructor(
    configService: ConfigService,
    private readonly parserService: PDPParserService,
    private readonly kafkaProducer: KafkaProducerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(configService, PDPParserConfigs.name);
    this.params = arguments;
  }

  public validator(): Promise<void> {
    return Promise.resolve();
  }

  async process(
    data: ParserRequestPayload,
    logger: SandyLogger,
  ): Promise<void> {
    try {
      const allConfigurations = (await this.cacheManager.get(
        'configurations',
      )) as CachedConfigurations;
      const pdpConfigs = allConfigurations.PDPParser;

      const parsedData = this.parserService.parse(
        data,
        pdpConfigs as ParsingConfigurations,
      );

      // Send the parsed result to Kafka
      await this.kafkaProducer.send({
        topic: KafkaTopics.pdpResult,
        message: JSON.stringify(parsedData),
      });

      logger.log('PDPParserHandler: Successfully processed parser request.');
    } catch (err) {
      logger.error('PDPParserHandler: Failed to process parser request', err);
    }
  }

  getTopicNames(): string {
    return KafkaTopics.pdpParserRequest;
  }

  getGroupId(): string {
    return PDPParserConfigs.groupId;
  }

  getCount(): number {
    return this.configService.get('app.oliveYoung.numberOfPdpParsers', 0, {
      infer: true,
    });
  }
}
