/* eslint-disable prefer-rest-params */
import { Injectable } from '@nestjs/common';
import { BaseKafkaHandler } from 'src/utils/base.handler';
import { PLPParserService } from './plp-parser.service';
import { ConfigService } from '@nestjs/config';
import KafkaProducerService from 'src/kafka/kafka.producer';
import { KafkaTopics, PLPParserConfigs } from '../constants';

@Injectable()
export class PLPParserHandler extends BaseKafkaHandler {
  constructor(
    configService: ConfigService,
    private readonly parserService: PLPParserService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    super(configService, PLPParserConfigs.name);
    this.params = arguments;
  }

  public validator(): Promise<void> {
    return Promise.resolve();
  }

  public async process(data: any): Promise<void> {
    const parsedData = await this.parserService.parse(data.html);

    // Send parsed data to Kafka
    await this.kafkaProducer.send({
      topic: KafkaTopics.plpResult,
      message: JSON.stringify(parsedData),
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
