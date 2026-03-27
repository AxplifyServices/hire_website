import { Controller, Get } from '@nestjs/common';
import { AgencesService } from './agences.service';

@Controller('agences')
export class AgencesController {
  constructor(private readonly agencesService: AgencesService) {}

  @Get()
  findAll() {
    return this.agencesService.findAll();
  }
}