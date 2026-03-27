import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AgencesModule } from './agences/agences.module';
import { VehiculesModule } from './vehicules/vehicules.module';
import { OptionsModule } from './options/options.module';
import { AssurancesModule } from './assurances/assurances.module';
import { PolitiquesAgeModule } from './politiques-age/politiques-age.module';
import { TarificationsModule } from './tarifications/tarifications.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AuthModule } from './auth/auth.module';
import { CodesPromoModule } from './codes-promo/codes-promo.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // ✅ CRON activé ici

    PrismaModule,
    AuthModule,
    AgencesModule,
    VehiculesModule,
    OptionsModule,
    AssurancesModule,
    PolitiquesAgeModule,
    TarificationsModule,
    ReservationsModule,
    CodesPromoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}