import { Module } from '@nestjs/common';
import { VehiculesController } from './vehicules.controller';
import { VehiculesService } from './vehicules.service';

@Module({
  controllers: [VehiculesController],
  providers: [VehiculesService],
})
export class VehiculesModule {}