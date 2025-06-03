import { Controller, Get, Post, Query } from '@nestjs/common';
import { CityService } from './city.service';
import { City } from '@prisma/client';

@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get('search')
  async search(@Query('q') query: string): Promise<City[]> {
    return this.cityService.searchCities(query);
  }

  @Post('import-all')
  async importAllCities() {
    return this.cityService.importFromExternalSource();
  }
}
