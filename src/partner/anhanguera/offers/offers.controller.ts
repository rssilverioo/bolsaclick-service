import { Controller, Get, Param } from '@nestjs/common';
import { GetOffersResponse } from './anhanguera-offers.types';
import { OffersAnhangueraService } from './offers.service';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('anhangueraOffers')
@ApiExcludeController()
export class OffersAnhangueraController {
  constructor(private readonly offersService: OffersAnhangueraService) {}

  @Get(':slug')
  async getOffers(
    @Param('slug') slug: string,
  ): Promise<GetOffersResponse | null> {
    return this.offersService.getOffersByCourseSlug(slug);
  }
}
