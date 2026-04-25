import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, type Consumer } from 'kafkajs';
import type {
  OpenSkyFirstPlaneDto,
  PlaneWeatherImpactDto,
} from './plane.types';
import { PlanesCacheService } from './planes-cache.service';

interface PlaneUpdateEvent {
  icao24: string;
  fetchedAt: number;
  source: 'opensky';
  plane: OpenSkyFirstPlaneDto | null;
}

@Injectable()
export class PlanesKafkaConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PlanesKafkaConsumerService.name);
  private readonly consumer: Consumer;
  private readonly planeUpdatesTopic: string;
  private readonly weatherImpactsTopic: string;

  constructor(
    private readonly config: ConfigService,
    private readonly cache: PlanesCacheService,
  ) {
    const brokers = this.getKafkaBrokers();
    const clientId =
      this.config.get<string>('KAFKA_CLIENT_ID') ?? 'api-gateway';
    const groupId =
      this.config.get<string>('KAFKA_CONSUMER_GROUP_ID') ??
      'api-gateway-group';

    const kafka = new Kafka({
      clientId,
      brokers,
    });

    this.consumer = kafka.consumer({ groupId });
    this.planeUpdatesTopic =
      this.config.get<string>('KAFKA_TOPIC_PLANES_UPDATES') ??
      'planes.opensky.updates';
    this.weatherImpactsTopic =
      this.config.get<string>('KAFKA_TOPIC_WEATHER_IMPACTS') ??
      'planes.weather.impacts';
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.planeUpdatesTopic,
      fromBeginning: true,
    });
    await this.consumer.subscribe({
      topic: this.weatherImpactsTopic,
      fromBeginning: true,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        const payload = message.value.toString();

        try {
          if (topic === this.planeUpdatesTopic) {
            const event = JSON.parse(payload) as PlaneUpdateEvent;
            if (!event?.icao24 || typeof event.fetchedAt !== 'number') {
              this.logger.warn(
                `Ignoring malformed plane update event: ${payload}`,
              );
              return;
            }

            this.cache.setPlane(
              event.icao24,
              event.plane ?? null,
              event.fetchedAt,
            );
            return;
          }

          const weatherImpact = JSON.parse(payload) as PlaneWeatherImpactDto;
          if (
            !weatherImpact?.icao24 ||
            typeof weatherImpact.weatherCheckedAt !== 'number'
          ) {
            this.logger.warn(
              `Ignoring malformed weather impact event: ${payload}`,
            );
            return;
          }

          this.cache.setWeatherImpact(weatherImpact.icao24, weatherImpact);
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Unknown Kafka parse error';
          this.logger.warn(`Ignoring unreadable Kafka message: ${msg}`);
        }
      },
    });

    this.logger.log(
      `Subscribed to Kafka topics "${this.planeUpdatesTopic}" and "${this.weatherImpactsTopic}"`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  private getKafkaBrokers(): string[] {
    const raw = this.config.get<string>('KAFKA_BROKERS');
    if (!raw) {
      return ['localhost:9092'];
    }

    const brokers = raw
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean);

    return brokers.length > 0 ? brokers : ['localhost:9092'];
  }
}
