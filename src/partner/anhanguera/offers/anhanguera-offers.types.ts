export interface AnhangueraUnitWithOffers {
  unitId: string;
  unitName: string;
  city: string;
  state: string;
  address: string;
  offers: any[];
}

export interface GetAnhangueraOffersResponse {
  course: string;
  slug: string;
  totalUnits: number;
  units: AnhangueraUnitWithOffers[];
}
export interface ShiftOffer {
  offerId: string;
  offerBusinessKey: string;
  shift: string;
  subscriptionValue: number;
  montlyFeeFrom: number;
  montlyFeeTo: number;
  expiredAt: string;
  weekday: string;
  brand: string;
  course: string;
  courseId: string;
  unit: string;
  unitId: string;
  unitAddress: string;
  unitCity: string;
  unitState: string;
  modality: string;
  scheduleList: string[][];
  financialBusinessOffer?: {
    baseValue: number;
    netValue: number;
    installments: {
      installment: string;
      netValue: number;
      ponctualityDiscountNetValue: number;
    }[];
  };
  lateEnrollment?: {
    baseValue: number;
    netValue: number;
    installments: {
      installment: string;
      netValue: number;
      ponctualityDiscountNetValue: number;
    }[];
    lateEnrollmentPaymentPlan?: {
      description: string;
      installmentCount: number;
      amount: number;
    };
  };
}

export interface UnitWithOffers {
  unitId: string;
  unitName: string;
  city: string;
  state: string;
  address: string;
  offers: ShiftOffer[];
}

export interface GetOffersResponse {
  course: string;
  slug: string;
  totalUnits: number;
  units: UnitWithOffers[];
}
export interface RawUnitCache {
  unitId: string;
  unitName?: string;
  unit?: string;
  city?: string;
  unitCity?: string;
  state?: string;
  unitState?: string;
  unitAddress?: string;
}
