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

export type UpdateType =
  | 'new_cruise'
  | 'party_themes_released'
  | 'guide_updated'
  | 'guide_live'
  | 'new_event'
  | 'new_artist'
  | 'schedule_updated'
  | 'ship_info_updated'
  | 'custom';

export type LinkSection = 'overview' | 'events' | 'artists' | 'schedule' | 'faqs' | 'ship' | 'none';

export interface Update {
  id: number;
  trip_id: number;
  title: string;
  description: string;
  update_type: UpdateType;
  custom_title?: string | null;
  link_section: LinkSection;
  show_on_homepage: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}
