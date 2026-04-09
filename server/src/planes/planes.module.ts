import { Module } from '@nestjs/common';
import { PlanesController } from './planes.controller';
import { PlanesCacheService } from './planes-cache.service';
import { PlanesKafkaConsumerService } from './planes-kafka-consumer.service';
import { PlanesService } from './planes.service';

@Module({
  controllers: [PlanesController],
  providers: [PlanesService, PlanesCacheService, PlanesKafkaConsumerService],
  exports: [PlanesService],
})
export class PlanesModule {}
