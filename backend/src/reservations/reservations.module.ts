import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { CodesPromoModule } from '../codes-promo/codes-promo.module';
import { AbandonedCartsService } from './abandoned-carts/abandoned-carts.service';

@Module({
  imports: [CodesPromoModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, AbandonedCartsService],
})
export class ReservationsModule {}