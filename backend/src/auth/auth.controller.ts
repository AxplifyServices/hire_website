import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UnauthorizedException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.authService.login(dto, req);
  }
  
  @Post('admin/login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.authService.me(req.user.id_client);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  deleteMe(@Req() req: any) {
    return this.authService.deleteClientById(req.user.id_client, {
      deleted_by_type: 'client',
      deleted_by_id: req.user.id_client,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('clients/:id_client')
  deleteClientById(@Param('id_client') id_client: string, @Req() req: any) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException(
        'Seul un administrateur peut désactiver un client.',
      );
    }

    return this.authService.deleteClientById(id_client, {
      deleted_by_type: 'admin',
      deleted_by_id: req.user?.id_admin ?? null,
    });
  }
}
