import { Module } from '@nestjs/common';
import { ProfilsBeneficiairesController } from './profils-beneficiaires.controller';
import { ProfilsBeneficiairesService } from './profils-beneficiaires.service';

@Module({
  controllers: [ProfilsBeneficiairesController],
  providers: [ProfilsBeneficiairesService],
  exports: [ProfilsBeneficiairesService],
})
export class ProfilsBeneficiairesModule {}