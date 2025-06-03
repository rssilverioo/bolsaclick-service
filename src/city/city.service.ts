/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { City } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class CityService {
  constructor(private readonly prisma: PrismaService) {}

  async searchCities(query: string): Promise<City[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const filter = {
      OR: [
        {
          city: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          state: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
      ],
    };

    const results: City[] = await this.prisma.city.findMany({
      where: filter,
      orderBy: {
        city: 'asc',
      },
    });

    return results;
  }

  async importFromExternalSource(): Promise<string> {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const inserted = new Set<string>();

    for (const letter of letters) {
      try {
        const response = await axios.get(
          `https://api.consultoriaeducacao.app.br/offers/v2/showLocalities?q=${letter}`,
        );

        const cities = response.data.data;

        for (const city of cities) {
          const key = `${city.city}-${city.state}`.toLowerCase();
          if (inserted.has(key)) continue;
          inserted.add(key);

          const exists = await this.prisma.city.findFirst({
            where: {
              city: city.city,
              state: city.state,
            },
          });

          if (!exists) {
            await this.prisma.city.create({
              data: {
                city: city.city,
                state: city.state,
                lat: city.lat,
                lon: city.lon,
              },
            });
          }
        }
      } catch (err) {
        console.error(`Erro na letra '${letter}':`, err.message);
      }
    }

    return 'Importação concluída.';
  }
}
