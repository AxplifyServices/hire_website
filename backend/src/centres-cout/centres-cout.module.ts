import { Module } from '@nestjs/common';
import { CentresCoutController } from './centres-cout.controller';
import { CentresCoutService } from './centres-cout.service';

@Module({
  controllers: [CentresCoutController],
  providers: [CentresCoutService],
  exports: [CentresCoutService],
})
export class CentresCoutModule {}