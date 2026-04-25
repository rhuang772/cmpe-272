import { Kafka, type Producer } from 'kafkajs';
import type { WeatherImpactEvent } from '../types';

export class WeatherImpactsProducer {
  private readonly producer: Producer;

  constructor(
    clientId: string,
    brokers: string[],
    private readonly topic: string,
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

  async publishImpact(event: WeatherImpactEvent): Promise<void> {
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: event.icao24,
          value: JSON.stringify(event),
        },
      ],
    });
  }
}
