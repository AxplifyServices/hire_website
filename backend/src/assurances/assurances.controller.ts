import { Controller, Get } from '@nestjs/common';
import { AssurancesService } from './assurances.service';

@Controller('assurances')
export class AssurancesController {
  constructor(private readonly assurancesService: AssurancesService) {}

  @Get()
  findAll() {
    return this.assurancesService.findAll();
  }
}