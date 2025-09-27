/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ShowOfferResponse } from 'src/offers/offer.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { normalizeModality } from 'src/utils/normalize-modality';
import { uniqBy } from 'lodash';

type UnitFromAPI = {
  unitId: string;
  unitAddress?: string;
  unitCity?: string;
  unitState?: string;
  unitPostalCode?: string;
  unitNumber?: string;
  unitComplement?: string;
  unitDistrict?: string;
  modality?: string;
  city: string;
  state: string;
  source?: string;
};

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

@Injectable()
export class KrotonService {
  private readonly logger = new Logger(KrotonService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) { }

  async getOffersByCourseSlug(
    brand: string,
    courseSlug: string,
    city?: string,
    state?: string,
    modality?: string,
  ): Promise<ShowOfferResponse[]> {
    const resolvedCity = city || 'São Paulo';
    const resolvedState = state || 'SP';
    const resolvedModality = normalizeModality(modality) || 'A distância';

    const universityCourse = await this.prisma.universityCourse.findFirst({
      where: { course: { slug: courseSlug }, university: { slug: brand } },
      include: { course: true, university: true },
    });

    if (!universityCourse) {
      throw new Error(`Curso não encontrado para ${brand}`);
    }

    return this.getOffersByCourseAndLocation(
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
  }

  async getOffersByCourseAndLocation(
    brand: string,
    courseId: string,
    courseNameExternal: string,
    courseSlug: string,
    courseNameInternal: string,
    city: string,
    state: string,
    modality: string,
    universityName: string,
  ): Promise<ShowOfferResponse[]> {
    const normalizedModality = normalizeModality(modality);
    const cacheKey = `offers:${brand}:${courseId}:${city}:${state}:${normalizedModality}`;

    const cached = await this.redis.get(cacheKey);
    if (typeof cached === 'string') {
      this.logger.log(`♻️ Cache hit: ${cacheKey}`);
      try {
        return JSON.parse(cached) as ShowOfferResponse[];
      } catch {
        // se der parse error, ignora e continua
      }
    }

    const units = await this.fetchUnitsByCourse(
      brand,
      courseId,
      courseNameExternal,
      city,
      state,
      normalizedModality,
    );

    if (!units.length) {
      await this.redis.set(cacheKey, JSON.stringify([]), TTL_SECONDS);
      return [];
    }

    const allOffersArrays = await Promise.all(
      units.map((u) => {
        const unitModality = normalizeModality(u.modality ?? normalizedModality);
        return this.fetchOffersByUnit(
          brand,
          u.unitId,
          courseId,
          u.city,
          u.state,
          courseNameExternal,
          unitModality,
        ).catch((err) => {
          this.logger.error(
            `❌ Erro ao buscar ofertas da unidade ${u.unitId}: ${this.axMsg(err)}`,
          );
          return [] as ShowOfferResponse[];
        });
      }),
    );

    const fullOffers = allOffersArrays.flat().map((offer, idx) => {
      const unit = units[idx] ?? units[0];
      return this.normalizeOffer(
        offer,
        {
          address: unit.unitAddress || '',
          city: unit.unitCity || unit.city || '',
          state: unit.unitState || unit.state || '',
          postalCode: unit.unitPostalCode || '',
          number: unit.unitNumber || '',
          complement: unit.unitComplement || '',
          district: unit.unitDistrict || '',
        },
        {
          brand: universityName,
          courseNameExternal,
          courseSlug,
          courseNameInternal,
          courseExternalId: courseId,
          modality: normalizedModality,
          source: unit.source,
        },
      );
    });

    // 🔹 Remove duplicados (considerando offerId + unidade)
    const dedupedOffers = uniqBy(
      fullOffers.map((o) => ({
        ...o,
        _dedupKey: `${o.offerId}-${o.unit.city}-${o.unit.state}`,
      })),
      '_dedupKey',
    ).map(({ _dedupKey, ...rest }) => rest);

    await this.redis.set(cacheKey, JSON.stringify(dedupedOffers), TTL_SECONDS);
    return dedupedOffers;
  }

  private async fetchUnitsByCourse(
    brand: string,
    courseId: string,
    courseNameExternal: string,
    city: string,
    state: string,
    modality: string,
  ): Promise<UnitFromAPI[]> {
    const normalizedModality = normalizeModality(modality);
    const url =
      `https://api.consultoriaeducacao.app.br/offers/v3/showCaseFilter` +
      `?brand=${encodeURIComponent(brand)}` +
      `&modality=${encodeURIComponent(normalizedModality)}` +
      `&city=${encodeURIComponent(city)}` +
      `&state=${encodeURIComponent(state)}` +
      `&course=${encodeURIComponent(courseId)}` +
      `&courseName=${encodeURIComponent(courseNameExternal)}` +
      `&app=DC&size=10`;

    const { data } = await axios.get(url);

    return ((data?.data as UnitFromAPI[]) || []).map((u) => ({
      ...u,
      modality: normalizeModality(u.modality),
      source: u.source ?? '',
    }));
  }

  private async fetchOffersByUnit(
    brand: string,
    unitId: string,
    courseId: string,
    city: string,
    state: string,
    courseNameExternal: string,
    modality: string,
  ): Promise<ShowOfferResponse[]> {
    const normalizedModality = normalizeModality(modality);
    const url =
      `https://api.consultoriaeducacao.app.br/offers/v3/showShiftOffers` +
      `?brand=${encodeURIComponent(brand)}` +
      `&modality=${encodeURIComponent(normalizedModality)}` +
      `&courseId=${encodeURIComponent(courseId)}` +
      `&courseName=${encodeURIComponent(courseNameExternal)}` +
      `&unitId=${encodeURIComponent(unitId)}` +
      `&city=${encodeURIComponent(city)}` +
      `&state=${encodeURIComponent(state)}` +
      `&app=DC`;

    const { data } = await axios.get(url);

    const shifts = data?.data?.shifts as Record<string, unknown>;
    const offers: ShowOfferResponse[] = [];

    if (shifts && typeof shifts === 'object') {
      for (const group of Object.values(shifts)) {
        if (group && typeof group === 'object') {
          for (const raw of Object.values(group as Record<string, unknown>)) {
            offers.push(raw as ShowOfferResponse);
          }
        }
      }
    }

    return offers;
  }

  private normalizeOffer(
    raw: any,
    unit: {
      address: string;
      city: string;
      state: string;
      postalCode?: string;
      number?: string;
      complement?: string;
      district?: string;
    },
    meta: {
      brand: string;
      courseNameExternal: string;
      courseSlug: string;
      courseNameInternal: string;
      courseExternalId: string;
      modality: string;
       source?: string; 
    },
  ): ShowOfferResponse {
      this.logger.debug(`Offer raw keys: ${Object.keys(raw)}`);

    return {
      offerId: String(raw.offerId ?? ''),
      offerBusinessKey: String(raw.offerBusinessKey ?? ''),
      shift: String(raw.shift ?? ''),
      subscriptionValue: Number(raw.subscriptionValue ?? 0),
      monthlyFeeFrom: Number(raw.montlyFeeFrom ?? raw.monthlyFeeFrom ?? 0),
      monthlyFeeTo: Number(raw.montlyFeeTo ?? raw.monthlyFeeTo ?? 0),
      expirationDate: String(raw.expiredAt ?? raw.expirationDate ?? ''),
      brand: meta.brand,
      courseName: meta.courseNameExternal,
      courseSlug: meta.courseSlug,
      courseNameInternal: meta.courseNameInternal,
      courseExternalId: meta.courseExternalId,
      source: meta.source ?? String(raw.source ?? ''),
      unit: {
        address: unit.address,
        city: unit.city,
        state: unit.state,
        modality: normalizeModality(meta.modality),
        postalCode: unit.postalCode,
        number: unit.number,
        complement: unit.complement,
        district: unit.district,
      },
    };
  }

  private axMsg(err: unknown) {
    const e = err as AxiosError<any>;
    if (e?.response) {
      return `HTTP ${e.response.status} - ${JSON.stringify(e.response.data).slice(0, 300)}`;
    }
    if (e?.request) return 'Sem resposta da API';
    return e?.message ?? String(err);
  }

  async flushBrand(brand: string) {
    await this.redis.deleteByPattern(`offers:${brand}:*`);
    await this.redis.deleteByPattern(`unit:${brand}:*`);
    return { ok: true };
  }
}
