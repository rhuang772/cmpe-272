import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PlanesController } from './planes.controller';
import { PlanesService } from './planes.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 20000,
      maxRedirects: 3,
    }),
  ],
  controllers: [PlanesController],
  providers: [PlanesService],
  exports: [PlanesService],
})
export class PlanesModule {}
