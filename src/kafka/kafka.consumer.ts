import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, KafkaMessage, logLevel } from 'kafkajs';
import { SandyLogger } from 'src/utils/sandy.logger';
import { TimeUtils } from 'src/utils/time.utils';
import { BaseKafkaHandler } from '../utils/base.handler';

@Injectable()
export class KafkaConsumerService {
    constructor(private configService: ConfigService) {}

    async listen(handler: BaseKafkaHandler) {
        const processCount = handler.getCount();
        console.log('processCount');
        if (!processCount) {
            return;
        }
        const topics = handler.getTopicNames();
        console.log('listen at topics', topics);
        if (!topics) {
            return;
        }

        for (let index = 0; index < processCount; index++) {
            const handlerInstance: BaseKafkaHandler = handler.clone();
            await handlerInstance.setup();
            void this.start(index, handlerInstance, topics.split(','));
        }
    }

    async start(
        index: number,
        handlerInstance: BaseKafkaHandler,
        topics: string[],
    ) {
        try {
            await handlerInstance.validator();
        } catch (error) {
            console.log('error at validator', error);
            return;
        }

        console.log('Startfunc: ', this.configService.get('app.kafka'));
        const kafka = new Kafka({
            logLevel: logLevel.INFO,
            brokers: this.configService
                .get<string>('app.kafka.brokers', 'localhost:29092', {
                    infer: true,
                })
                .split(','),
            clientId: this.configService.get<string>(
                'app.kafka.client',
                'musinsa-client',
                {
                    infer: true,
                },
            ),
        });

        const groupId = await handlerInstance.getGroupId();
        const kafkaConfig = {
            groupId,
            sessionTimeout: +this.configService.get<number>(
                'kafka_session_timeout',
                12000,
                {
                    infer: true,
                },
            ),
            heartbeatInterval: +this.configService.get<number>(
                'heart_beat_interval',
                3000,
                { infer: true },
            ),
        };
        console.log('kafkaConfig', kafkaConfig);
        const consumer = kafka.consumer(kafkaConfig);
        while (true) {
            try {
                await consumer.connect();
                break;
            } catch (error) {
                console.error('error at connect', error.message);
                await TimeUtils.sleep(5000);
            }
        }

        console.log('topics: ', JSON.stringify(topics));
        await consumer.subscribe({
            topics,
            fromBeginning: handlerInstance.fromBeginning,
        });
        consumer.on('consumer.stop', (e) => {
            console.log('on stop', e);
        });
        consumer.on('consumer.crash', (e) => {
            console.error(`consumer crash ${handlerInstance.name}`, e);
        });
        consumer.on('consumer.heartbeat', (e) => {
            console.log(`heartbeat ${handlerInstance.name}`, JSON.stringify(e));
        });
        consumer.on('consumer.disconnect', (e) => {
            console.error(`consumer disconnect ${handlerInstance.name}`, e);
        });
        consumer.on('consumer.connect', () => {
            console.log(`consumer connected ${handlerInstance.name}`);
        });
        consumer.on('consumer.group_join', (e: any) => {
            console.log(`consumer joinend ${handlerInstance.name}`, e);
        });
        consumer.on('consumer.rebalancing', (e) => {
            console.log(`consumer rebalancing ${handlerInstance.name}`, e);
        });

        await consumer.run({
            autoCommit: false,
            eachMessage: async (kafkaData: {
                topic: string;
                partition: number;
                message: KafkaMessage;
                heartbeat(): Promise<void>;
            }) => {
                const { message } = kafkaData;
                const logger = new SandyLogger({
                    partition: kafkaData.partition.toString(),
                    offset: kafkaData.message.offset,
                    clazz: handlerInstance.name,
                });
                logger.start(`handler_${handlerInstance.name}`);
                const heartbeatInterval = setInterval(
                    async () => {
                        try {
                            await kafkaData.heartbeat();
                        } catch (error) {
                            console.error('error at heartbeat', error.message);
                        }
                    },
                    Math.max(kafkaConfig.heartbeatInterval - 500, 100),
                );
                try {
                    const messageData = JSON.parse(
                        message?.value ? message.value.toString() : '{}',
                    );
                    try {
                        await handlerInstance.handle(
                            kafkaData,
                            messageData,
                            logger,
                        );
                    } catch (error) {
                        logger.error('error at handler', error);
                    }
                    clearInterval(heartbeatInterval);
                    try {
                        const commitOffsets = {
                            topic: kafkaData.topic,
                            partition: kafkaData.partition,
                            offset: String(+kafkaData.message.offset + 1),
                        };
                        await consumer.commitOffsets([commitOffsets]);
                    } catch (error) {
                        console.error(
                            'ERROR-COMMIT',
                            kafkaData.topic,
                            message.offset,
                            kafkaData.partition,
                        );
                        logger.clearWhenError('ERROR-COMMIT', error);
                    }
                } catch (error) {
                    console.error('[ERROR-CONSUMER]', error);
                }
                logger.complete();
            },
        });
    }
}
