/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ShiftOffer,
  GetOffersResponse,
  UnitWithOffers,
  RawUnitCache,
} from './anhanguera-offers.types';
import { parseStructuredOffers } from './offers.utils';

@Injectable()
export class OffersAnhangueraService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async getOffersByCourseSlug(slug: string): Promise<GetOffersResponse | null> {
    const course = await this.prisma.course.findUnique({ where: { slug } });
    if (!course) return null;

    const universityCourses = await this.prisma.universityCourse.findMany({
      where: {
        courseId: course.id,
        university: { slug: 'anhanguera' },
      },
      include: { university: true },
    });

    if (!universityCourses.length) return null;

    const externalId = universityCourses[0].externalId;
    const offerKeys = await this.redisService.keys(
      `offers:anhanguera:${externalId}:*`,
    );

    const result: UnitWithOffers[] = [];

    for (const offerKey of offerKeys) {
      const unitId = offerKey.split(':').pop();
      if (!unitId) continue;

      const unitKey = `unit:anhanguera:${unitId}`;

      const [offersCacheRaw, unitCacheRaw] = await Promise.all([
        this.redisService.get(offerKey),
        this.redisService.get(unitKey),
      ]);

      if (
        typeof offersCacheRaw !== 'string' ||
        typeof unitCacheRaw !== 'string'
      )
        continue;

      try {
        let offers: ShiftOffer[] = [];

        try {
          const parsed = JSON.parse(offersCacheRaw);

          if (Array.isArray(parsed)) {
            offers = parsed as ShiftOffer[];
          } else if (parsed?.data?.shifts) {
            offers = parseStructuredOffers(parsed.data);
          } else {
            console.warn(
              `❌ Formato inesperado de oferta para unidade ${unitId}`,
            );
            continue;
          }
        } catch (error) {
          console.warn(
            `❌ Erro ao fazer parse de ofertas da unidade ${unitId}:`,
            error,
          );
          continue;
        }

        const unit = JSON.parse(unitCacheRaw) as RawUnitCache;

        result.push({
          unitId: unit.unitId,
          unitName: unit.unitName ?? unit.unit ?? '',
          city: unit.city ?? unit.unitCity ?? '',
          state: unit.state ?? unit.unitState ?? '',
          address: unit.unitAddress ?? '',
          offers,
        });
      } catch (err) {
        console.warn(`❌ Failed to parse unit data for ${unitId}:`, err);
        continue;
      }
    }

    return {
      course: course.name,
      slug: course.slug,
      totalUnits: result.length,
      units: result,
    };
  }
}
