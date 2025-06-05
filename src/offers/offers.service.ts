/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { AnhangueraService } from '../partner/anhanguera/anhanguera.service';
import { ShowOfferResponse } from '../partner/anhanguera/anhanguera.service';

export interface StandardOfferResponse {
  course: string;
  slug: string;
  university: string;
  modality: string;
  totalUnits: number;
  units: {
    unitId: string;
    unitName: string;
    city: string;
    state: string;
    address: string;
    modality: string;
    offers: {
      offerId: string;
      shift: string;
      priceFrom: number;
      priceTo: number;
      subscriptionPrice: number;
      expiresAt: string;
    }[];
  }[];
}

@Injectable()
export class OffersService {
  constructor(private readonly anhangueraService: AnhangueraService) {}

  async getNormalizedOffers(params: {
    course?: string;
    city?: string;
    state?: string;
    modality?: string;
    university?: string;
  }): Promise<StandardOfferResponse[]> {
    const { course, city, state, modality, university } = params;
    const results: StandardOfferResponse[] = [];

    if (!university || university === 'anhanguera') {
      if (course) {
        try {
          const offers = await this.anhangueraService.getOffersByCourse(
            course,
            city,
            state,
            modality,
          );
          const normalized = this.normalizeOffers(offers);
          results.push(normalized);
        } catch (err) {
          console.error(
            `❌ Erro ao buscar curso '${course}' na Anhanguera:`,
            err.message,
          );
        }
      } else {
        // Aqui você precisará buscar todos os cursos que estão em cache no Redis.
        // Supondo que você tenha um método como esse:
        // const allOffers = await this.anhangueraService.getAllOffersFromCache();
        // results.push(...allOffers.map(this.normalizeOffers));
      }
    }

    return results;
  }

  private normalizeOffers(data: ShowOfferResponse[]): StandardOfferResponse {
    if (!data.length) {
      return {
        course: '',
        slug: '',
        university: 'Anhanguera',
        modality: '',
        totalUnits: 0,
        units: [],
      };
    }

    const courseName = data[0].courseNameInternal;
    const courseSlug = data[0].courseSlug;

    const groupedByUnit = new Map<string, StandardOfferResponse['units'][0]>();

    for (const offer of data) {
      const key = `${offer.unit.address}|${offer.unit.city}|${offer.unit.state}`;
      if (!groupedByUnit.has(key)) {
        groupedByUnit.set(key, {
          unitId: offer.courseExternalId,
          unitName: offer.courseName,
          city: offer.unit.city,
          state: offer.unit.state,
          address: offer.unit.address,
          modality: offer.unit.modality,
          offers: [],
        });
      }

      groupedByUnit.get(key)!.offers.push({
        offerId: offer.offerId,
        shift: offer.shift,
        priceFrom: offer.montlyFeeFrom,
        priceTo: offer.montlyFeeTo,
        subscriptionPrice: offer.subscriptionValue,
        expiresAt: offer.expiredAt,
      });
    }
    const modality = data[0].unit.modality;

    return {
      course: courseName,
      slug: courseSlug,
      university: 'Anhanguera',
      totalUnits: groupedByUnit.size,
      modality,
      units: Array.from(groupedByUnit.values()),
    };
  }
}
