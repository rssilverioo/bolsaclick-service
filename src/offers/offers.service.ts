import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { ShowOfferResponse } from './offer.type';

interface OfferFilters {
  course?: string;
  city?: string;
  state?: string;
  brand?: string;
}

@Injectable()
export class OffersService {
  constructor(private readonly redisService: RedisService) {}

  async showOffers(): Promise<ShowOfferResponse[]> {
    const data = await this.redisService.get('offers:anhanguera:full');

    if (!data || typeof data !== 'string') {
      return [];
    }

    try {
      return JSON.parse(data) as ShowOfferResponse[];
    } catch (error) {
      console.error('❌ Erro ao fazer parse das ofertas:', error);
      return [];
    }
  }

  async showOffersWithFilters(
    filters: OfferFilters,
  ): Promise<ShowOfferResponse[]> {
    const { course, city, state, brand } = filters;
    const allOffers = await this.showOffers();

    return allOffers.filter((offer) => {
      const matchesCourse =
        !course || offer.courseSlug?.toLowerCase() === course.toLowerCase();

      const matchesBrand =
        !brand || offer.brand?.toLowerCase() === brand.toLowerCase();

      const matchesCity =
        !city || offer.unit.city?.toLowerCase() === city.toLowerCase();

      const matchesState =
        !state || offer.unit.state?.toLowerCase() === state.toLowerCase();

      return matchesCourse && matchesBrand && matchesCity && matchesState;
    });
  }
}
