import { Module } from '@nestjs/common';
import { CodesPromoService } from './codes-promo.service';
import { CodesPromoController } from './codes-promo.controller';

@Module({
  controllers: [CodesPromoController],
  providers: [CodesPromoService],
  exports: [CodesPromoService],
})
export class CodesPromoModule {}