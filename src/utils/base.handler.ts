/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConfigService } from '@nestjs/config';
import { SandyLogger } from './sandy.logger';

export abstract class BaseKafkaHandler {
  public name: string;
  public fromBeginning: boolean;
  protected params: any;

  constructor(
    protected configService: ConfigService,
    name: string,
    ...params: any[]
  ) {
    this.name = name;

    this.fromBeginning =
      this.configService.get(`from_begin_${this.name}`, '1', {
        infer: true,
      }) == '1';
    this.params = params;
  }

  public clone() {
    const cloneClass: any = this.constructor;
    return new cloneClass(...this.params);
  }

  public async setup() {}

  public getCount() {
    const key = `number_of_${this.name}`;
    const processCount = this.configService.get<number>(key, 0, {
      infer: true,
    });
    return processCount;
  }

  public getTopicNames(): string {
    return this.configService.get(`topic_${this.name}`, `${this.name}`, {
      infer: true,
    });
  }

  getGroupId() {
    return this.configService.get<string>(
      `consumer_group_${this.name}`,
      `${this.configService.get<string>(
        'consumer_group_base',
        'musinsa-group',
        {
          infer: true,
        },
      )}-${this.name}`,
      {
        infer: true,
      },
    );
  }

  public abstract validator(): Promise<void>;

  public async handle(kafkaData: any, msg: any, logger: SandyLogger) {
    try {
      const rs = await this.process(msg, logger);
      await this.onProcessSuccess(kafkaData, msg, rs, logger);
    } catch (error) {
      await this.onProcessError(kafkaData, msg, error, logger);
    }
  }

  abstract process(data: any, logger: SandyLogger): Promise<any>;
  async onProcessSuccess(
    kafkaData: any,
    msg: any,
    result: any,
    logger: SandyLogger,
  ) {}

  async onProcessError(
    kafkaData: any,
    msg: any,
    error: any,
    logger: SandyLogger,
  ) {
    logger.errorAndFinish(`error at hanlder ${this.name}`, error);
  }
}
