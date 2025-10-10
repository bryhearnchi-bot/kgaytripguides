export interface TripInfoSection {
  id: number;
  title: string;
  content: string | null;
  section_type: 'trip-specific' | 'general' | 'always';
  updated_at: string;
  created_at?: string;
  assignment?: {
    id: number;
    trip_id: number;
    order_index: number;
  };
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  section_type: 'trip-specific' | 'general' | 'always';
  created_at: string;
  updated_at: string;
  assignment?: {
    id: number;
    trip_id: number;
    order_index: number;
  };
}
