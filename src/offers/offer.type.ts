export interface ShowOfferResponse {
  offerId: string;
  offerBusinessKey: string;
  shift: string;
  subscriptionValue: number;
  monthlyFeeFrom: number;
  monthlyFeeTo: number;
  expirationDate: string;
  brand: string;
  courseName: string;
  courseSlug: string;
  courseExternalId: string;
  courseNameInternal: string;
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
