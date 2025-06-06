/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

export interface ShowOfferResponse {
  offerId: string;
  shift: string;
  subscriptionValue: number;
  montlyFeeFrom: number;
  montlyFeeTo: number;
  expiredAt: string;
  brand: string;
  courseName: string;
  courseSlug: string;
  courseNameInternal: string;
  courseExternalId: string;
  unit: {
    address: string;
    city: string;
    state: string;
    modality: string;
    postalCode?: string;
    number?: string;
    complement?: string;
    district?: string;
  };
}

@Injectable()
export class UnoparService {
  constructor(
    private readonly redisService: RedisService,
    public readonly prisma: PrismaService,
  ) {}

  async fetchUnitsByCourse(
    courseId: string,
    courseName: string,
    city: string,
    state: string,
    modality: string,
  ): Promise<any[]> {
    const url = `https://api.consultoriaeducacao.app.br/offers/v3/showCaseFilter?brand=unopar&modality=${encodeURIComponent(
      modality,
    )}&city=${encodeURIComponent(city)}&state=${state}&course=${courseId}&courseName=${encodeURIComponent(
      courseName,
    )}&app=DC&size=10`;

    try {
      const { data } = await axios.get(url);
      return data?.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar unidades:', error.response?.data || error.message);
      return [];
    }
  }

  async fetchOffersByUnit(
    unitId: string,
    courseId: string,
    city: string,
    state: string,
    courseName: string,
    modality: string,
  ): Promise<ShowOfferResponse[]> {
    const url = `https://api.consultoriaeducacao.app.br/offers/v3/showShiftOffers?brand=unopar&modality=${encodeURIComponent(
      modality,
    )}&courseId=${courseId}&courseName=${encodeURIComponent(
      courseName,
    )}&unitId=${unitId}&city=${encodeURIComponent(city)}&state=${state}&app=DC`;

    try {
      const { data } = await axios.get(url);
      const offers: ShowOfferResponse[] = [];
      const shifts = data?.data?.shifts as Record<string, any>;

      if (shifts && typeof shifts === 'object') {
        for (const shiftGroup of Object.values(shifts)) {
          if (typeof shiftGroup === 'object' && shiftGroup !== null) {
            for (const offer of Object.values(shiftGroup)) {
              offers.push(offer as ShowOfferResponse);
            }
          }
        }
      }

      return offers;
    } catch (error) {
      console.error(`❌ Erro ao buscar ofertas da unidade ${unitId}:`, error.response?.data || error.message);
      return [];
    }
  }

  async getOffersByCourse(
    course: string,
    city?: string,
    state?: string,
    modality?: string,
  ): Promise<ShowOfferResponse[]> {
    const resolvedCity = city || 'São Paulo';
    const resolvedState = state || 'SP';
    const resolvedModality = modality || 'A distância';

    const universityCourse = await this.prisma.universityCourse.findFirst({
      where: {
        course: { slug: course },
        university: { slug: 'unopar' },
      },
      include: {
        course: true,
        university: true,
      },
    });

    if (!universityCourse) {
      throw new Error('Curso da unopar não encontrado');
    }

    return this.getOffersByCourseAndLocation(
      universityCourse.externalId,
      universityCourse.externalName,
      universityCourse.course.slug,
      universityCourse.course.name,
      resolvedCity,
      resolvedState,
      resolvedModality,
      universityCourse.university.name,
    );
  }

  async getOffersBySlug(
    slug: string,
    city?: string,
    state?: string,
    modality?: string,
  ): Promise<ShowOfferResponse[]> {
    const resolvedCity = city || 'São Paulo';
    const resolvedState = state || 'SP';
    const resolvedModality = modality || 'A distância';

    const universityCourse = await this.prisma.universityCourse.findFirst({
      where: {
        course: { slug },
        university: { slug: 'unopar' },
      },
      include: {
        course: true,
        university: true,
      },
    });

    if (!universityCourse) {
      throw new Error('Curso da unopar não encontrado');
    }

    return this.getOffersByCourseAndLocation(
      universityCourse.externalId,
      universityCourse.externalName,
      universityCourse.course.slug,
      universityCourse.course.name,
      resolvedCity,
      resolvedState,
      resolvedModality,
      universityCourse.university.name,
    );
  }

  async getOffersByCourseAndLocation(
    courseId: string,
    courseName: string,
    courseSlug: string,
    courseNameInternal: string,
    city: string,
    state: string,
    modality: string,
    universityName: string,
  ): Promise<ShowOfferResponse[]> {
    const key = `offers:unopar:${courseId}:${city}:${state}:${modality}`;
    const cached = await this.redisService.get(key);
    if (typeof cached === 'string') {
      console.log(`♻️ Cache hit para ${key}`);
      return JSON.parse(cached) as ShowOfferResponse[];
    }

    const units = await this.fetchUnitsByCourse(courseId, courseName, city, state, modality);
    if (!units.length) return [];

    const fullOffers: ShowOfferResponse[] = [];

    for (const unit of units) {
      console.log(`🔍 Buscando ofertas para unidade ${unit.unitId} - ${unit.unitCity}/${unit.unitState}`);

      const offers = await this.fetchOffersByUnit(
        unit.unitId,
        courseId,
        unit.unitCity,
        unit.unitState,
        courseName,
        modality,
      );

      for (const offer of offers) {
        fullOffers.push({
          offerId: offer.offerId,
          shift: offer.shift ?? '',
          subscriptionValue: offer.subscriptionValue ?? 0,
          montlyFeeFrom: offer.montlyFeeFrom ?? 0,
          montlyFeeTo: offer.montlyFeeTo ?? 0,
          expiredAt: offer.expiredAt ?? '',
          brand: universityName,
          courseName,
          courseSlug,
          courseNameInternal,
          courseExternalId: courseId,
          unit: {
            address: unit.unitAddress || '',
            city: unit.unitCity || '',
            state: unit.unitState || '',
            modality,
            postalCode: unit.unitPostalCode || '',
            number: unit.unitNumber || '',
            complement: unit.unitComplement || '',
            district: unit.unitDistrict || '',
          },
        });
      }
    }

    await this.redisService.set(key, JSON.stringify(fullOffers), 60 * 60 * 24 * 7); // 7 dias
    return fullOffers;
  }
async deleteAllUnoparData() {
  console.log('🧨 Limpando TODAS as chaves da unopar no Redis...');
  await this.redisService.deleteByPattern('offers:unopar:*');
  await this.redisService.deleteByPattern('unit:unopar:*');
  console.log('✅ Dados da unopar removidos do Redis com sucesso');
}
}
