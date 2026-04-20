import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CentresCoutService } from './centres-cout.service';
import { UpdateCentreCoutDto } from './dto/update-centre-cout.dto';

@UseGuards(JwtAuthGuard)
@Controller('centres-cout')
export class CentresCoutController {
  constructor(private readonly centresCoutService: CentresCoutService) {}

  @Patch(':id_centre_cout')
  updateCentreCout(
    @Param('id_centre_cout') id_centre_cout: string,
    @Body() dto: UpdateCentreCoutDto,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut modifier un centre de coût.',
      );
    }

    return this.centresCoutService.updateCentreCout(id_centre_cout, dto);
  }

  @Delete(':id_centre_cout')
  removeCentreCout(
    @Param('id_centre_cout') id_centre_cout: string,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Seul un administrateur peut supprimer un centre de coût.',
      );
    }

    return this.centresCoutService.removeCentreCout(id_centre_cout);
  }
}