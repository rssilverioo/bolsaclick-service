/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShowOfferResponse } from './offer.type';
import { KrotonService } from './providers/kroton/kroton.service';

export interface GetOffersParams {
  course?: string;          // slug do nosso Course
  city?: string;
  state?: string;
  modality?: string;
  universityEntity?: string; // opcional: restringe a uma universidade
}

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly krotonService: KrotonService,
  ) {}

  async getOffers(
    params?: GetOffersParams,
  ): Promise<ShowOfferResponse[] | { message: string }> {
    // Caso 1: sem "course" → devolve tudo que estiver no cache
    if (!params?.course) {
      const keys = await this.redisService.keys('offers:*');
      const allOffers: ShowOfferResponse[] = [];

      for (const key of keys) {
        const cached = await this.redisService.get(key);
        if (typeof cached === 'string') {
          try {
            const offers: ShowOfferResponse[] = JSON.parse(cached);
            allOffers.push(...offers);
          } catch (err) {
            this.logger.warn(`⚠️ Erro ao parsear cache ${key}`);
          }
        }
      }

      return allOffers.length > 0
        ? allOffers
        : { message: 'Nenhuma oferta encontrada no cache.' };
    }

    // Caso 2: com "course" → busca no banco
    const { course, city, state, modality, universityEntity } = params;
    const resolvedCity = city || 'São Paulo';
    const resolvedState = state || 'SP';
    const resolvedModality = modality || 'A distância';

    const universityCourses = await this.prisma.universityCourse.findMany({
      where: {
        course: { slug: course },
        ...(universityEntity ? { university: { slug: universityEntity } } : {}),
      },
      include: { course: true, university: true },
    });

    if (!universityCourses?.length) {
      throw new Error('Curso não encontrado em nenhuma universidade cadastrada.');
    }

    const allOffers: ShowOfferResponse[] = [];

    for (const uc of universityCourses) {
      const universitySlug = uc.university.slug;
      const cacheKey = `offers:${universitySlug}:${course}:${resolvedCity}:${resolvedState}:${resolvedModality}`;

      // 1. Primeiro tenta pegar do cache
      const cached = await this.redisService.get(cacheKey);
      if (typeof cached === 'string') {
        this.logger.log(`♻️ Cache hit: ${cacheKey}`);
        try {
          const offers: ShowOfferResponse[] = JSON.parse(cached);
          allOffers.push(...offers);
          continue; // vai para próximo curso
        } catch {
          this.logger.warn(`⚠️ Cache inválido em ${cacheKey}, refazendo consulta.`);
        }
      }

      // 2. Caso não tenha cache → chama o provider correto
      let offers: ShowOfferResponse[] = [];

      switch (universitySlug) {
        case 'anhanguera':
        case 'unopar':
        case 'ampli':
          offers = await this.krotonService.getOffersByCourseAndLocation(
            universitySlug,
            uc.externalId,
            uc.externalName,
            uc.course.slug,
            uc.course.name,
            resolvedCity,
            resolvedState,
            resolvedModality,
            uc.university.name,
          );
          break;

        default:
          this.logger.warn(`⚠️ Universidade ${universitySlug} não integrada.`);
          continue;
      }

      await this.redisService.set(cacheKey, JSON.stringify(offers), 60 * 60 * 24 * 7);

      allOffers.push(...offers);
    }

    return allOffers.length > 0
      ? allOffers
      : { message: 'Nenhuma oferta encontrada para o curso informado.' };
  }
}
