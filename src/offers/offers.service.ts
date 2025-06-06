/* eslint-disable prettier/prettier */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AnhangueraService, ShowOfferResponse } from 'src/partner/anhanguera/anhanguera.service';
import { UnoparService } from 'src/partner/unopar/unopar.service';

export interface GetOffersParams {
  course?: string;
  city?: string;
  state?: string;
  modality?: string;
  universityEntity?: string;
}

@Injectable()
export class OffersService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly anhangueraService: AnhangueraService,
    private readonly unoparService: UnoparService,
  ) {}

  async getOffers(params?: GetOffersParams): Promise<ShowOfferResponse[] | { message: string }> {
    if (!params?.course) {
      const keys = await this.redisService.keys('offers:*');
      const allOffers: ShowOfferResponse[] = [];

      for (const key of keys) {
        const cached = await this.redisService.get(key);
        if (typeof cached === 'string') {
          const offers: ShowOfferResponse[] = JSON.parse(cached);
          allOffers.push(...offers);
        }
      }

      return allOffers.length > 0
        ? allOffers
        : { message: 'Nenhuma oferta encontrada no cache.' };
    }

    const { course, city, state, modality } = params;
    const resolvedCity = city || 'São Paulo';
    const resolvedState = state || 'SP';
    const resolvedModality = modality || 'A distância';

    const universityCourses = await this.prisma.universityCourse.findMany({
      where: {
        course: {
          slug: course,
        },
      },
      include: {
        course: true,
        university: true,
      },
    });

    if (!universityCourses || universityCourses.length === 0) {
      throw new Error('Curso não encontrado em nenhuma universidade cadastrada.');
    }

    const allOffers: ShowOfferResponse[] = [];

    for (const universityCourse of universityCourses) {
      const universitySlug = universityCourse.university.slug;
      const cacheKey = `offers:${universitySlug}:${course}:${resolvedCity}:${resolvedState}:${resolvedModality}`;

      const cached = await this.redisService.get(cacheKey);
      if (typeof cached === 'string') {
        console.log(`♻️ Cache hit: ${cacheKey}`);
        const offers: ShowOfferResponse[] = JSON.parse(cached);
        allOffers.push(...offers);
        continue;
      }

      let offers: ShowOfferResponse[] = [];

      switch (universitySlug) {
        case 'anhanguera':
          offers = await this.anhangueraService.getOffersByCourseAndLocation(
            universityCourse.externalId,
            universityCourse.externalName,
            universityCourse.course.slug,
            universityCourse.course.name,
            resolvedCity,
            resolvedState,
            resolvedModality,
            universityCourse.university.name,
          );
          break;

        case 'unopar':
          offers = await this.unoparService.getOffersByCourseAndLocation(
            universityCourse.externalId,
            universityCourse.externalName,
            universityCourse.course.slug,
            universityCourse.course.name,
            resolvedCity,
            resolvedState,
            resolvedModality,
            universityCourse.university.name,
          );
          break;

        default:
          console.warn(`⚠️ Universidade ${universitySlug} não está integrada.`);
          continue;
      }

      // Sempre salva no Redis, mesmo que não tenha encontrado nada
      await this.redisService.set(cacheKey, JSON.stringify(offers), 60 * 60 * 24 * 7);
      allOffers.push(...offers);
    }

    return allOffers.length > 0
      ? allOffers
      : { message: 'Nenhuma oferta encontrada para o curso informado.' };
  }
}
