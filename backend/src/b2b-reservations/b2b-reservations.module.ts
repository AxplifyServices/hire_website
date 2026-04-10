import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { B2bCoreModule } from '../b2b-core/b2b-core.module';
import { B2bReservationsController } from './b2b-reservations.controller';
import { B2bReservationsService } from './b2b-reservations.service';

@Module({
  imports: [PrismaModule, B2bCoreModule],
  controllers: [B2bReservationsController],
  providers: [B2bReservationsService],
})
export class B2bReservationsModule {}