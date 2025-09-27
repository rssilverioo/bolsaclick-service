/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { ShowcaseService } from './show-case.service';

@Controller('show-case')
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  @Get()
  async getShowcase(
    @Query('modality') modality?: string,
    @Query('courseName') courseName?: string,
    @Query('brand') brand?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.showcaseService.getShowcase({
      modality,
      courseName,
      brand,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  }
}
