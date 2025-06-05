import { Controller, Get, Query } from '@nestjs/common';
import { OffersService, StandardOfferResponse } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  async getNormalizedOffers(
    @Query('course') course?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('modality') modality?: string,
    @Query('university') university?: string,
  ): Promise<StandardOfferResponse[]> {
    return this.offersService.getNormalizedOffers({
      course,
      city,
      state,
      modality,
      university,
    });
  }
}
