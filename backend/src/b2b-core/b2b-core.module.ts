import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QuotaEngineService } from './quota-engine.service';
import { PolicyEngineService } from './policy-engine.service';
import { ValidationEngineService } from './validation-engine.service';

@Module({
  imports: [PrismaModule],
  providers: [QuotaEngineService, PolicyEngineService, ValidationEngineService],
  exports: [QuotaEngineService, PolicyEngineService, ValidationEngineService],
})
export class B2bCoreModule {}