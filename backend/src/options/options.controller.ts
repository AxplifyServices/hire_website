import { Controller, Get } from '@nestjs/common';
import { OptionsService } from './options.service';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  findAll() {
    return this.optionsService.findAll();
  }
}