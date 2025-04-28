export type MarkerCategory = 'ice' | 'observer';

export interface Marker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  category: MarkerCategory;
  createdAt: Date;
  active: boolean;
  lastConfirmed?: Date;
  reliability_score?: number;
  negative_confirmations?: number;
}

interface MarkerFormData {
  category: MarkerCategory;
}