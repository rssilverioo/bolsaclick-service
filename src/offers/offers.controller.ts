/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { OffersService, GetOffersParams } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  getOffers(@Query() query: GetOffersParams) {
    return this.offersService.getOffers(query);
  }
}
