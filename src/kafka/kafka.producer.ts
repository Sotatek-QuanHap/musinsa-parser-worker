import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message, Producer, RequestTimeoutEvent } from 'kafkajs';
import { KafkaUtil } from '../utils/kafka.utils';
import { TimeUtils } from '../utils/time.utils';

@Injectable()
export default class KafkaProducerService {
  private producer: Producer;
  private static self: KafkaProducerService;
  private connected: boolean;
  constructor(private configService: ConfigService) {
    KafkaProducerService.self = this;
    this.connected = false;
  }

  public async start(): Promise<void> {
    const kafka = KafkaUtil.loadClient(this.configService);
    this.producer = kafka.producer({
      retry: {
        retries: 5,
      },
    });
    this.producer.on('producer.connect', () => {
      this.connected = true;
      console.log('====== producer is connect ======');
    });
    this.producer.on(
      'producer.network.request_timeout',
      (e: RequestTimeoutEvent) => {
        console.log('timeout', e);
      },
    );

    try {
      await this.producer.connect();
      console.log('this.connected', this.connected);
      return;
    } catch (error) {
      this.connected = false;
      console.log('[PRODUCER-NO-CONNECT]', error);
      await TimeUtils.sleep(5000);
      await this.start();
    }
  }

  public async send({
    topic,
    message,
    key,
  }: {
    topic: string;
    message: string;
    key?: string;
  }) {
    const msg: Message = { value: message };
    if (key) {
      msg.key = key;
    }
    while (!this.connected) {
      await TimeUtils.sleep(1000);
    }
    console.log('sending to topic', topic);
    const rs = await this.producer.send({ topic, messages: [msg] });
    return rs;
  }

  public static async push({
    topic,
    message,
    key,
  }: {
    topic: string;
    message: string;
    key?: string;
  }) {
    return await this.self.send({ topic, message, key });
  }
}
