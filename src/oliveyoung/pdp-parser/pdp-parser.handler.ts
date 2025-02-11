/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { BaseKafkaHandler } from 'src/utils/base.handler';
import { PDPParserService } from './pdp-parser.service';
import { ConfigService } from '@nestjs/config';
import { SandyLogger } from 'src/utils/sandy.logger';
import KafkaProducerService from 'src/kafka/kafka.producer';
import { KafkaTopics, PDPParserConfigs } from '../constants';

@Injectable()
export class PDPParserHandler extends BaseKafkaHandler {
  constructor(
    configService: ConfigService,
    private readonly parserService: PDPParserService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    super(configService, PDPParserConfigs.name);
    this.params = arguments;
  }

  public validator(): Promise<void> {
    return Promise.resolve();
  }

  public async process(data: any, logger: SandyLogger): Promise<void> {
    const parsedData = await this.parserService.parse(data.html);

    // Send parsed data to Kafka
    await this.kafkaProducer.send({
      topic: KafkaTopics.pdpResult,
      message: JSON.stringify(parsedData),
    });
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
