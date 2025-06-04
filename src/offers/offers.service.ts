/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShowOfferResponse } from './offer.type';
interface OfferFilters {
  course?: string;
  city?: string;
  state?: string;
  brand?: string;
}

@Injectable()
export class OffersService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async showOffers(): Promise<ShowOfferResponse[]> {
    const keys = await this.redisService.keys('offers:*:*');
    const offersList: ShowOfferResponse[] = [];
    const slugCache = new Map<string, string>(); // externalId → slug

    for (const key of keys) {
      const parts = key.split(':');
      const brand = parts[1];
      const externalId = parts[2];
      const unitId = parts[3];

      const [offersRaw, unitRaw] = await Promise.all([
        this.redisService.get(key),
        this.redisService
          .get(`unit:${brand}:${unitId}`)
          .then((res) => (res ? res : this.redisService.get(`unit:${unitId}`))),
      ]);

      if (typeof offersRaw !== 'string' || typeof unitRaw !== 'string')
        continue;

      try {
        const offers = JSON.parse(offersRaw);
        const unit = JSON.parse(unitRaw);

        // ✅ pega o slug a partir do externalId (usa cache para evitar repetição)
        let courseSlug = slugCache.get(externalId);
        if (!courseSlug) {
          const course = await this.prisma.course.findFirst({
            where: {
              universityCourses: {
                some: {
                  externalId,
                },
              },
            },
            select: { slug: true },
          });

          courseSlug = course?.slug || '';
          slugCache.set(externalId, courseSlug);
        }

        for (const offer of offers) {
          offersList.push({
            offerId: offer.offerId,
            shift: offer.shift,
            subscriptionValue: offer.subscriptionValue,
            monthlyFeeFrom: offer.montlyFeeFrom,
            monthlyFeeTo: offer.montlyFeeTo,
            expirationDate: offer.expiredAt,
            brand: offer.brand ?? brand,
            courseName: offer.course ?? '',
            courseSlug,
            courseExternalId: externalId,
            unit: {
              address: unit.unitAddress || '',
              city: unit.unitCity || unit.city || '',
              state: unit.unitState || unit.state || '',
              modality: offer.modality || '',
            },
          });
        }
      } catch (err) {
        console.warn(`❌ Failed to parse offer at ${key}:`, err);
        continue;
      }
    }

    return offersList;
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
