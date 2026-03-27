import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AssurancesController } from './assurances.controller';
import { AssurancesService } from './assurances.service';

@Module({
  imports: [PrismaModule],
  controllers: [AssurancesController],
  providers: [AssurancesService],
})
export class AssurancesModule {}