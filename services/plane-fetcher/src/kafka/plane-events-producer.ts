import { Kafka, type Producer } from 'kafkajs';
import type { PlaneFetchErrorEvent, PlaneUpdateEvent } from '../types';

export class PlaneEventsProducer {
  private readonly producer: Producer;

  constructor(
    clientId: string,
    brokers: string[],
    private readonly updatesTopic: string,
    private readonly errorsTopic: string,
  ) {
    const kafka = new Kafka({ clientId, brokers });
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async publishUpdate(event: PlaneUpdateEvent): Promise<void> {
    await this.producer.send({
      topic: this.updatesTopic,
      messages: [
        {
          key: event.icao24,
          value: JSON.stringify(event),
        },
      ],
    });
  }

  async publishError(event: PlaneFetchErrorEvent): Promise<void> {
    await this.producer.send({
      topic: this.errorsTopic,
      messages: [
        {
          key: event.icao24,
          value: JSON.stringify(event),
        },
      ],
    });
  }
}
