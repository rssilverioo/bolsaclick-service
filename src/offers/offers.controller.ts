import { Controller, Get, Query } from '@nestjs/common';
import { OffersService } from './offers.service';
import { ShowOfferResponse } from './offer.type';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  async getFilteredOffers(
    @Query('course') course?: string, // slug do curso
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('brand') brand?: string,
  ): Promise<{ success: boolean; total: number; data: ShowOfferResponse[] }> {
    const offers = await this.offersService.showOffersWithFilters({
      course,
      city,
      state,
      brand,
    });

    return {
      success: true,
      total: offers.length,
      data: offers,
    };
  }
}
