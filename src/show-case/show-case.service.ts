/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { ShowOfferResponse } from 'src/offers/offer.type';

@Injectable()
export class ShowcaseService {
  constructor(private readonly redis: RedisService) {}

  async getShowcase(params: {
    modality?: string;
    courseName?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ShowOfferResponse[]> {
    const { modality, courseName, brand, minPrice, maxPrice } = params;

    // Pegar todas as chaves de ofertas salvas no Redis
    const keys = await this.redis.keys('offers:*');
    const allOffers: ShowOfferResponse[] = [];

    for (const key of keys) {
      const cached = await this.redis.get(key);
      if (typeof cached === 'string') {
        try {
          const offers: ShowOfferResponse[] = JSON.parse(cached);
          allOffers.push(...offers);
        } catch {
          // ignora erros de parse
        }
      }
    }

    // Se não houver nada no cache
    if (!allOffers.length) {
      return [];
    }

    // 🔹 Aplicar filtros
    let filtered = allOffers;

    if (modality) {
      filtered = filtered.filter(
        o =>
          o.unit?.modality?.toLowerCase() === modality.toLowerCase(),
      );
    }

    if (courseName) {
      filtered = filtered.filter(o =>
        o.courseName.toLowerCase().includes(courseName.toLowerCase()),
      );
    }

    if (brand) {
      filtered = filtered.filter(
        o => o.brand.toLowerCase() === brand.toLowerCase(),
      );
    }

    if (minPrice !== undefined) {
      filtered = filtered.filter(o => o.monthlyFeeTo >= minPrice);
    }

    if (maxPrice !== undefined) {
      filtered = filtered.filter(o => o.monthlyFeeTo <= maxPrice);
    }

    return filtered;
  }
}
