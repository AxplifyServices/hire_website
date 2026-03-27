import { Module } from '@nestjs/common';
import { CodesPromoService } from './codes-promo.service';

@Module({
  providers: [CodesPromoService],
  exports: [CodesPromoService],
})
export class CodesPromoModule {}
