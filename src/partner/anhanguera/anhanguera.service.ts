/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { Cron } from '@nestjs/schedule';

// Tipo simplificado da oferta. Você pode expandir se quiser.
type ShiftOffer = {
  offerId: string;
  course: string;
  unit: string;
  unitId: string;
  modality: string;
  subscriptionValue: number;
  montlyFeeTo: number;
  financialBusinessOffer?: any;
  lateEnrollment?: any;
};

@Injectable()
export class AnhangueraService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron('0 2 * * 5') // Toda sexta-feira às 2h da manhã
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
    )}&app=DC`;

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
  ): Promise<ShiftOffer[]> {
    const url = `https://api.consultoriaeducacao.app.br/offers/v3/showShiftOffers?brand=anhanguera&modality=${encodeURIComponent(
      modality,
    )}&courseId=${courseId}&courseName=${encodeURIComponent(
      courseName,
    )}&unitId=${unitId}&city=${encodeURIComponent(city)}&state=${state}&app=DC`;

    const { data } = await axios.get(url);

    const offers: ShiftOffer[] = [];

    const shifts = data?.data?.shifts as Record<
      string,
      Record<string, ShiftOffer>
    >;

    if (shifts) {
      for (const group of Object.values(shifts)) {
        for (const offer of Object.values(group)) {
          offers.push(offer);
        }
      }
    }

    console.log(
      `🧾 Ofertas para unitId=${unitId} (curso: ${courseName}):`,
      JSON.stringify(offers, null, 2),
    );

    return offers;
  }

  async syncAllOffers() {
    const universityCourses = await this.prisma.universityCourse.findMany({
      where: {
        university: {
          slug: 'anhanguera',
        },
      },
      include: {
        course: true,
        university: true,
      },
    });

    const cities = await this.prisma.city.findMany();

    const modalities = ['A distância', 'Presencial', 'Semipresencial'];

    for (const uc of universityCourses) {
      const courseId = uc.externalId;
      const courseName = uc.externalName;

      console.log(`🎓 Curso: ${uc.course.name}`);
      console.log(`📦 externalId: ${courseId}`);
      console.log(`📘 externalName: ${courseName}`);

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

            console.log(
              `📍 Cidade: ${city.city}, Estado: ${city.state}, Modalidade: ${modality}`,
            );
            console.log(`🏢 ${units.length} unidades encontradas`);

            for (const unit of units) {
              const offers = await this.fetchOffersByUnit(
                unit.unitId,
                courseId,
                unit.city,
                unit.state,
                courseName,
                modality,
              );

              const offerKey = `offers:anhanguera:${courseId}:${unit.unitId}:${modality}`;
              const unitKey = `unit:anhanguera:${unit.unitId}`;

              await this.redisService.set(
                offerKey,
                JSON.stringify(offers),
                60 * 60 * 24 * 7,
              );
              await this.redisService.set(
                unitKey,
                JSON.stringify(unit),
                60 * 60 * 24 * 7,
              );

              console.log(
                `✅ Unidade ${unit.unitId} | ${offers.length} ofertas`,
              );
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

    console.log('🎉 Finalizado syncAllOffers');
  }
}
