/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { BaseKafkaHandler } from 'src/utils/base.handler';
import { PDPParserService } from './pdp-parser.service';
import { ConfigService } from '@nestjs/config';
import { SandyLogger } from 'src/utils/sandy.logger';
import KafkaProducerService from 'src/kafka/kafka.producer';

@Injectable()
export class PDPParserHandler extends BaseKafkaHandler {
  constructor(
    configService: ConfigService,
    private readonly parserService: PDPParserService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    super(
      configService,
      configService.get(
        'app.oliveYoung.pdpParser.name',
        'olive_young_pdp_parser',
        {
          infer: true,
        },
      ),
    );
    this.params = arguments;
  }

  public validator(): Promise<void> {
    return Promise.resolve();
  }

  public async process(data: any, logger: SandyLogger): Promise<void> {
    const parsedData = await this.parserService.parse(data.html);

    // Send to Kafka for parsing
    await this.kafkaProducer.send({
      topic: this.configService.get<string>(
        'app.oliveYoung.topics.pdpResult',
        'olive-young.pdp.result',
        { infer: true },
      ),
      message: JSON.stringify(parsedData),
    });
  }

  getTopicNames(): string {
    return this.configService.get(
      'app.oliveYoung.topics.pdpParserRequest',
      'olive-young.pdp-parser.request',
      { infer: true },
    );
  }

  getGroupId(): string {
    return this.configService.get<string>(
      'app.oliveYoung.pdpParser.groupId',
      'olive-young-pdp-parser-group',
      { infer: true },
    );
  }

  getCount(): number {
    return this.configService.get(
      'app.oliveYoung.pdpParser.numberOfHandlers',
      0,
      { infer: true },
    );
  }
}
