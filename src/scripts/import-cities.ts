/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/scripts/import-cities.ts

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

async function importCities() {
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

        const exists = await prisma.city.findFirst({
          where: {
            city: city.city,
            state: city.state,
          },
        });

        if (!exists) {
          await prisma.city.create({
            data: {
              city: city.city,
              state: city.state,
              lat: city.lat,
              lon: city.lon,
            },
          });
          console.log(`✅ Inserido: ${city.city} - ${city.state}`);
        } else {
          console.log(`⏭️ Já existe: ${city.city} - ${city.state}`);
        }
      }
    } catch (err) {
      console.error(`❌ Erro na letra '${letter}':`, err.message);
    }
  }

  await prisma.$disconnect();
  console.log('🏁 Importação concluída.');
}

importCities();
