/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ShiftOffer } from './anhanguera-offers.types';

export function parseStructuredOffers(raw: any): ShiftOffer[] {
  const result: ShiftOffer[] = [];

  if (!raw?.shifts || typeof raw.shifts !== 'object') return result;

  for (const shiftKey of Object.keys(raw.shifts)) {
    const weekdays = raw.shifts[shiftKey];
    for (const weekdayKey of Object.keys(weekdays)) {
      const offer = weekdays[weekdayKey];
      if (offer && typeof offer === 'object') {
        result.push({
          ...offer,
          shift: shiftKey,
          weekday: weekdayKey,
        });
      }
    }
  }

  return result;
}
