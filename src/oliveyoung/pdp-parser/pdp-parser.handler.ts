/* eslint-disable prefer-rest-params */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseKafkaHandler } from 'src/utils/base.handler';
import { PDPParserService } from './pdp-parser.service';
import { ConfigService } from '@nestjs/config';
import { SandyLogger } from 'src/utils/sandy.logger';
import KafkaProducerService from 'src/kafka/kafka.producer';
import { KafkaTopics, PDPParserConfigs } from '../constants';
import { ParserRequestPayload, UpdateConfigRequestPayload } from './types';
import { isUpdateConfigRequest } from './utils';

@Injectable()
export class PDPParserHandler extends BaseKafkaHandler implements OnModuleInit {
  private parserConfiguration: any = null;
  private pendingRequests: ParserRequestPayload[] = [];

  constructor(
    configService: ConfigService,
    private readonly parserService: PDPParserService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    super(configService, PDPParserConfigs.name);
    this.params = arguments;
  }

  async onModuleInit() {
    await this.requestConfiguration();
  }

  async requestConfiguration() {
    if (!this.parserConfiguration) {
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

  public async process(
    data: UpdateConfigRequestPayload | ParserRequestPayload,
    logger: SandyLogger,
  ): Promise<void> {
    if (isUpdateConfigRequest(data)) {
      await this.updateParserConfig(data, logger);
      return;
    }

    if (!this.parserConfiguration) {
      logger.warn(
        'PDPParserHandler: No configuration available. Requesting configuration from Kafka.',
      );
      await this.requestConfiguration();

      // Add this request to the pending queue
      this.pendingRequests.push(data as ParserRequestPayload);
      logger.warn(
        'PDPParserHandler: Request added to the queue. It will be processed once the configuration is available.',
      );
      return;
    }

    await this.processParserRequest(data, logger);
  }

  private async processParserRequest(
    data: ParserRequestPayload,
    logger: SandyLogger,
  ): Promise<void> {
    try {
      const parsedData = this.parserService.parse(
        data,
        this.parserConfiguration,
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

  async updateParserConfig(data: any, logger: SandyLogger) {
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      this.parserConfiguration = config.value;
      console.log('update ', this.parserConfiguration);

      logger.log(
        'PDPParserHandler: Parser configuration updated from crawlerConfig topic.',
      );

      await this.processPendingRequests(logger);
    } catch (err) {
      logger.error('PDPParserHandler: Failed to update configuration', err);
    }
  }

  private async processPendingRequests(logger: SandyLogger) {
    if (this.pendingRequests.length === 0) {
      logger.log('PDPParserHandler: No pending requests to process.');
      return;
    }

    logger.log(
      `PDPParserHandler: Processing ${this.pendingRequests.length} pending requests.`,
    );

    // Process each pending request
    for (const request of this.pendingRequests) {
      await this.processParserRequest(request, logger);
    }

    // Clear the queue after processing
    this.pendingRequests = [];
  }

  getTopicNames(): string {
    return `${KafkaTopics.pdpParserRequest},${KafkaTopics.pdpConfigUpdate}`;
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
