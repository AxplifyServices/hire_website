import { Module } from '@nestjs/common';
import { PolitiquesAgeController } from './politiques-age.controller';
import { PolitiquesAgeService } from './politiques-age.service';

@Module({
  controllers: [PolitiquesAgeController],
  providers: [PolitiquesAgeService]
})
export class PolitiquesAgeModule {}
