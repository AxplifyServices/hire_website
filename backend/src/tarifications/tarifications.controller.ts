import { Controller, Get } from '@nestjs/common';
import { TarificationsService } from './tarifications.service';

@Controller('tarifications')
export class TarificationsController {
  constructor(
    private readonly tarificationsService: TarificationsService,
  ) {}

  @Get()
  findAll() {
    return this.tarificationsService.findAll();
  }
}