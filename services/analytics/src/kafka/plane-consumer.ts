import { Kafka, type Consumer } from 'kafkajs';
import type { OpenSkyFirstPlaneDto, PlaneUpdateEvent } from '../types';

export class PlaneConsumer {
  private readonly consumer: Consumer;
  private readonly topic: string;
  readonly planes = new Map<string, OpenSkyFirstPlaneDto>();

  constructor(
    clientId: string,
    brokers: string[],
    groupId: string,
    topic: string,
  ) {
    const kafka = new Kafka({ clientId, brokers });
    this.consumer = kafka.consumer({ groupId });
    this.topic = topic;
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.topic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        try {
          const event = JSON.parse(
            message.value.toString(),
          ) as PlaneUpdateEvent;

          if (!event?.icao24 || typeof event.fetchedAt !== 'number') return;

          if (event.plane) {
            this.planes.set(event.icao24, event.plane);
          } else {
            this.planes.delete(event.icao24);
          }
        } catch {
          // skip malformed messages
        }
      },
    });

    console.log(`Subscribed to Kafka topic "${this.topic}"`);
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
