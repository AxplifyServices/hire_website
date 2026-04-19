import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { ListClientsDto } from './dto/list-clients.dto';
import { CreateClientAdminDto } from './dto/create-client-admin.dto';
import { UpdateClientAdminDto } from './dto/update-client-admin.dto';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@Query() dto: ListClientsDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.clientsService.findAll(dto);
  }

  @Get(':id_client')
  findOne(@Param('id_client') id_client: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.clientsService.findOne(id_client);
  }

  @Post()
  create(@Body() dto: CreateClientAdminDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.clientsService.create(dto);
  }

  @Patch(':id_client')
  update(
    @Param('id_client') id_client: string,
    @Body() dto: UpdateClientAdminDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.clientsService.update(id_client, dto);
  }

  @Delete(':id_client')
  remove(@Param('id_client') id_client: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.clientsService.remove(id_client);
  }

  private assertAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException(
        'Seul un administrateur peut gérer les clients.',
      );
    }
  }
}