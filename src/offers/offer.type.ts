/* eslint-disable prettier/prettier */
export interface ShowOfferResponse {
  offerId: string;
  shift: string;
  subscriptionValue: number;
  monthlyFeeFrom: number;
  monthlyFeeTo: number;
  expirationDate: string;
  brand: string;
  courseName: string;
  courseSlug: string;
  courseExternalId: string; // ✅ Adicionado este campo
  unit: {
    address: string;
    city: string;
    state: string;
    modality: string;
  };
}

export interface UniversitySlugParam {
  slug: string;
}

export interface CourseSlugParam {
  slug: string;
}
