import { Controller, Get, Query } from '@nestjs/common';
import { OffersService } from './offers.service';
import { ShowOfferResponse } from './offer.type';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  async getFilteredOffers(
    @Query('course') course?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('brand') brand?: string,
  ): Promise<ShowOfferResponse[]> {
    return this.offersService.showOffersWithFilters({
      course,
      city,
      state,
      brand,
    });
  }
}
