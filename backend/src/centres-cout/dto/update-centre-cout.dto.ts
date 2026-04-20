import { PartialType } from '@nestjs/mapped-types';
import { CreateCentreCoutDto } from '../../entreprises/dto/create-centre-cout.dto';

export class UpdateCentreCoutDto extends PartialType(CreateCentreCoutDto) {}