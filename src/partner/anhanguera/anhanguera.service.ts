/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { Cron } from '@nestjs/schedule';
import { format } from 'date-fns';

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
  };
}

@Injectable()
export class AnhangueraService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron('0 2 * * 5')
  async handleWeeklySync() {
    console.log('🔄 [CRON] Iniciando syncAllOffers para Anhanguera...');
    await this.syncAllOffers();
    console.log('✅ [CRON] Finalizado syncAllOffers para Anhanguera.');
  }

  async fetchUnitsByCourse(
    courseId: string,
    courseName: string,
    city: string,
    state: string,
    modality: string,
  ) {
    const url = `https://api.consultoriaeducacao.app.br/offers/v3/showCaseFilter?brand=anhanguera&modality=${encodeURIComponent(
      modality,
    )}&city=${encodeURIComponent(city)}&state=${state}&course=${courseId}&courseName=${encodeURIComponent(
      courseName,
    )}&app=DC&size=10`;

    const { data } = await axios.get(url);
    return data?.data || [];
  }

  async fetchOffersByUnit(
    unitId: string,
    courseId: string,
    city: string,
    state: string,
    courseName: string,
    modality: string,
  ): Promise<ShowOfferResponse[]> {
    const url = `https://api.consultoriaeducacao.app.br/offers/v3/showShiftOffers?brand=anhanguera&modality=${encodeURIComponent(
      modality,
    )}&courseId=${courseId}&courseName=${encodeURIComponent(
      courseName,
    )}&unitId=${unitId}&city=${encodeURIComponent(city)}&state=${state}&app=DC`;

    const { data } = await axios.get(url);

    const offers: ShowOfferResponse[] = [];
    const shifts = data?.data?.shifts as Record<string, unknown>;

    if (shifts) {
      for (const group of Object.values(shifts)) {
        if (typeof group === 'object' && group !== null) {
          for (const offer of Object.values(group as Record<string, unknown>)) {
            offers.push(offer as ShowOfferResponse);
          }
        }
      }
    }

    return offers;
  }

  async syncAllOffers(): Promise<number> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const previous = format(
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      'yyyy-MM-dd',
    );

    console.log(`🕒 Rodando sync para data: ${today}`);
    console.log(`🧹 Limpando dados antigos: ${previous}`);

    await this.redisService.deleteByPattern('offers:anhanguera:full');

    const universityCourses = await this.prisma.universityCourse.findMany({
      where: { university: { slug: 'anhanguera' } },
      include: { course: true, university: true },
    });

    const cities = await this.prisma.city.findMany();
    const modalities = ['A distância', 'Presencial', 'Semipresencial'];

    const fullOffers: ShowOfferResponse[] = [];
    let totalOffers = 0;

    for (const uc of universityCourses) {
      const courseId = uc.externalId;
      const courseName = uc.externalName;
      const courseSlug = uc.course.slug;
      const courseNameInternal = uc.course.name;
      const brand = uc.university.slug;

      for (const city of cities) {
        for (const modality of modalities) {
          try {
            const units = await this.fetchUnitsByCourse(
              courseId,
              courseName,
              city.city,
              city.state,
              modality,
            );

            for (const unit of units) {
              const offers = await this.fetchOffersByUnit(
                unit.unitId,
                courseId,
                unit.city,
                unit.state,
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
                  brand,
                  courseName,
                  courseSlug,
                  courseNameInternal,
                  courseExternalId: courseId,
                  unit: {
                    address: unit.unitAddress || '',
                    city: unit.unitCity || unit.city || '',
                    state: unit.unitState || unit.state || '',
                    modality,
                  },
                });
              }

              totalOffers += offers.length;
              console.log(`✅ ${offers.length} ofertas salvas para unidade ${unit.unitId}`);
            }
          } catch (error) {
            console.error(
              `❌ Erro em ${uc.course.name} - ${city.city}/${city.state} (${modality})`,
              error.message,
            );
          }
        }
      }
    }

    await this.redisService.set(
      'offers:anhanguera:full',
      JSON.stringify(fullOffers),
    );

    console.log(`📦 ${fullOffers.length} ofertas salvas em offers:anhanguera:full`);
    console.log(`🎯 Total de ofertas cadastradas: ${totalOffers}`);

    // ✅ Enviar webhook para o n8n
    try {
      await axios.post('https://aula-n8n.jru58d.easypanel.host/webhook/sync-finished', {
        status: 'success',
        source: 'anhanguera',
        totalOffers,
        syncedAt: new Date().toISOString(),
      });

      console.log('📬 Webhook de finalização enviado para o n8n');
    } catch (err) {
      console.error('❌ Falha ao enviar webhook para o n8n:', err.message);
    }

    return totalOffers;
  }

  async deleteAllAnhangueraData() {
    console.log('🧨 Limpando TODAS as chaves da Anhanguera no Redis...');
    await this.redisService.deleteByPattern('offers:anhanguera:*');
    await this.redisService.deleteByPattern('unit:anhanguera:*');
    console.log('✅ Dados da Anhanguera removidos do Redis com sucesso');
  }
}
