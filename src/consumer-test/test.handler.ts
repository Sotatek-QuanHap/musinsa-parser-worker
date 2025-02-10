/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { BaseKafkaHandler } from '../utils/base.handler';
import { SandyLogger } from '../utils/sandy.logger';
import { ConfigService } from '@nestjs/config';
import { TimeUtils } from '../utils/time.utils';

@Injectable()
export class ConsumerTestHandler extends BaseKafkaHandler {
  constructor(configService: ConfigService) {
    super(configService, 'test-topic');
    this.params = arguments;
  }
  public validator(): Promise<void> {
    return Promise.resolve();
  }

  async process(data: any, logger: SandyLogger): Promise<any> {
    console.log({ data });
    await TimeUtils.sleep(1000);
    return;
  }

  public getCount() {
      return 1
  }
}
