/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShowOfferResponse } from './offer.type';
import { KrotonService } from './providers/kroton/kroton.service';

export interface GetOffersParams {
  course?: string;
  city?: string;
  state?: string;
  modality?: string;
  brand?: string;
}

@Injectable()
export class OffersService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly krotonService: KrotonService,
  ) { }

  async getOffers(params?: GetOffersParams): Promise<ShowOfferResponse[] | { message: string }> {
    // Caso não seja informado nenhum curso → retorna cache existente (home page)
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

    // Busca todas as associações do curso (Anhanguera, Unopar, Ampli...)
    const universityCourses = await this.prisma.universityCourse.findMany({
      where: { course: { slug: course }, ...(params.brand ? { university: { slug: params.brand.toLowerCase() } } : {}), },
      include: { course: true, university: true },
    });

    if (!universityCourses || universityCourses.length === 0) {
      throw new Error('Curso não encontrado em nenhuma universidade cadastrada.');
    }

    const allOffers: ShowOfferResponse[] = [];
    const modalitiesFallback = ['Presencial', 'A distância', 'Semipresencial'];

    for (const universityCourse of universityCourses) {
      const brand = universityCourse.university.slug;
      const cacheKey = `offers:${brand}:${course}:${resolvedCity}:${resolvedState}:${resolvedModality}`;

      // 🔹 Cache hit
      const cached = await this.redisService.get(cacheKey);
      if (typeof cached === 'string') {
        console.log(`♻️ Cache hit: ${cacheKey}`);
        const offers: ShowOfferResponse[] = JSON.parse(cached);
        allOffers.push(...offers);
        continue;
      }

      // 🔹 Primeiro tenta com a modalidade pedida
      let offers = await this.krotonService.getOffersByCourseAndLocation(
        brand,
        universityCourse.externalId,
        universityCourse.externalName,
        universityCourse.course.slug,
        universityCourse.course.name,
        resolvedCity,
        resolvedState,
        resolvedModality,
        universityCourse.university.name,
      );

      // 🔹 Se não achar nada, tenta fallback em outras modalidades
      if (offers.length === 0) {
        for (const alt of modalitiesFallback) {
          if (alt !== resolvedModality) {
            const fallbackOffers = await this.krotonService.getOffersByCourseAndLocation(
              brand,
              universityCourse.externalId,
              universityCourse.externalName,
              universityCourse.course.slug,
              universityCourse.course.name,
              resolvedCity,
              resolvedState,
              alt,
              universityCourse.university.name,
            );

            if (fallbackOffers.length > 0) {
              console.log(`⚠️ Usando fallback de modalidade: ${alt} para ${brand}`);
              offers = fallbackOffers;
              break;
            }
          }
        }
      }

      // 🔹 Sempre salva no Redis, mesmo vazio
      await this.redisService.set(cacheKey, JSON.stringify(offers), 60 * 60 * 24 * 7);

      allOffers.push(...offers);
    }

    return allOffers.length > 0
      ? allOffers
      : { message: 'Nenhuma oferta encontrada para o curso informado.' };
  }
}
