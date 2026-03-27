import { Controller, Get, Query } from '@nestjs/common';
import { VehiculesService } from './vehicules.service';
import { SearchVehiculesDto } from './dto/search-vehicules.dto';
import { ListVehiculesDto } from './dto/list-vehicules.dto';

@Controller('vehicules')
export class VehiculesController {
  constructor(private readonly vehiculesService: VehiculesService) {}

  @Get()
  findAll(@Query() dto: ListVehiculesDto) {
    return this.vehiculesService.findAll(dto);
  }

  @Get('search')
  search(@Query() dto: SearchVehiculesDto) {
    return this.vehiculesService.search(dto);
  }
}