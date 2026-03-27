import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TarificationsController } from './tarifications.controller';
import { TarificationsService } from './tarifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [TarificationsController],
  providers: [TarificationsService],
})
export class TarificationsModule {}