// Supabase-based Storage Layer
// Complete storage implementation using Supabase Admin API

import { getSupabaseAdmin } from './supabase-admin';
import { logger } from './logging/logger';
import type {
  Profile,
  Trip,
  Itinerary,
  Event,
  Talent,
  TalentCategory,
  Settings,
} from '../shared/supabase-types';

// ============ PROFILE STORAGE ============

export interface IProfileStorage {
  getProfile(id: string): Promise<Profile | null>;
  createProfile(data: any): Promise<Profile>;
  updateProfile(id: string, data: any): Promise<Profile>;
  deleteProfile(id: string): Promise<void>;
  getAllProfiles(): Promise<Profile[]>;
}

export class ProfileStorage implements IProfileStorage {
  async getProfile(id: string): Promise<Profile | null> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();

    if (error) return null;
    return data;
  }

  async createProfile(data: any): Promise<Profile> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  async updateProfile(id: string, data: any): Promise<Profile> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  async deleteProfile(id: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id);

    if (error) throw error;
  }

  async getAllProfiles(): Promise<Profile[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// ============ TRIP STORAGE ============

export interface ITripStorage {
  getTripById(id: number): Promise<Trip | null>;
  getTripBySlug(slug: string): Promise<Trip | null>;
  createTrip(data: any): Promise<Trip>;
  updateTrip(id: number, data: any): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;
  getAllTrips(): Promise<Trip[]>;
  getUpcomingTrips(): Promise<Trip[]>;
  getPastTrips(): Promise<Trip[]>;
}

export class TripStorage implements ITripStorage {
  // Helper method to transform snake_case database fields to camelCase frontend fields
  public transformTripData(dbTrip: any): Trip {
    if (!dbTrip) return dbTrip;

    // Extract status from joined trip_status table or direct status field
    let status = null;
    if (dbTrip.trip_status?.status) {
      // From joined data (e.g., { trip_status: { status: 'Draft' } })
      status = dbTrip.trip_status.status.toLowerCase();
    } else if (dbTrip.status) {
      // Direct status field if exists
      status = dbTrip.status.toLowerCase();
    } else if (dbTrip.trip_status_id) {
      // Map common status IDs if no join data (fallback)
      const statusMap: { [key: number]: string } = {
        1: 'published',
        2: 'draft',
        3: 'archived',
      };
      status = statusMap[dbTrip.trip_status_id] || null;
    }

    return {
      id: dbTrip.id,
      name: dbTrip.name,
      slug: dbTrip.slug,
      shipName: dbTrip.ship_name,
      cruiseLine: dbTrip.cruise_line,
      resortName: dbTrip.resort_name,
      resortLocation: dbTrip.resort_location,
      tripType: dbTrip.trip_type,
      startDate: dbTrip.start_date,
      endDate: dbTrip.end_date,
      status: status,
      tripStatusId: dbTrip.trip_status_id,
      isActive: dbTrip.is_active,
      heroImageUrl: dbTrip.hero_image_url,
      description: dbTrip.description,
      highlights: dbTrip.highlights,
      wizardState: dbTrip.wizard_state,
      wizardCurrentPage: dbTrip.wizard_current_page,
      resortId: dbTrip.resort_id,
      shipId: dbTrip.ship_id,
      charterCompanyId: dbTrip.charter_company_id,
      charterCompanyName: dbTrip.charter_company_name,
      charterCompanyLogo: dbTrip.charter_company_logo,
      tripTypeId: dbTrip.trip_type_id,
      eventsCount: dbTrip.events_count,
      partiesCount: dbTrip.parties_count,
      talentCount: dbTrip.talent_count,
      itineraryEntries: dbTrip.itinerary_entries,
      scheduleEntries: dbTrip.schedule_entries,
      amenityIds: dbTrip.amenity_ids,
      venueIds: dbTrip.venue_ids,
      shipData: dbTrip.ship_data,
      resortData: dbTrip.resort_data,
      createdAt: dbTrip.created_at,
      updatedAt: dbTrip.updated_at,
    } as any;
  }

  async getTripById(id: number): Promise<Trip | null> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('trips').select('*').eq('id', id).single();

    if (error) return null;
    return this.transformTripData(data);
  }

  async getTripBySlug(slug: string): Promise<Trip | null> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('trips').select('*').eq('slug', slug).single();

    if (error) return null;
    return this.transformTripData(data);
  }

  async createTrip(data: any): Promise<Trip> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: trip, error } = await supabaseAdmin.from('trips').insert(data).select().single();

    if (error) throw error;
    return this.transformTripData(trip);
  }

  async updateTrip(id: number, data: any): Promise<Trip> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: trip, error } = await supabaseAdmin
      .from('trips')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.transformTripData(trip);
  }

  async deleteTrip(id: number): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('trips').delete().eq('id', id);

    if (error) throw error;
  }

  async getAllTrips(): Promise<Trip[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('is_active', true) // Only return active trips for public
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(trip => this.transformTripData(trip));
  }

  async getUpcomingTrips(): Promise<Trip[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .gte('start_date', today)
      .not('trip_status_id', 'in', '(4,5)') // Exclude Draft (ID 4) and Preview (ID 5)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(trip => this.transformTripData(trip));
  }

  async getPastTrips(): Promise<Trip[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .lt('end_date', today)
      .not('trip_status_id', 'in', '(4,5)') // Exclude Draft (ID 4) and Preview (ID 5)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(trip => this.transformTripData(trip));
  }
}

// ============ ITINERARY STORAGE ============

export interface IItineraryStorage {
  getItineraryByTrip(tripId: number): Promise<Itinerary[]>;
  createItineraryStop(data: any): Promise<Itinerary>;
  updateItineraryStop(id: number, data: any): Promise<Itinerary>;
  deleteItineraryStop(id: number): Promise<void>;
  bulkCreateItineraryStops(data: any[]): Promise<Itinerary[]>;
}

export class ItineraryStorage implements IItineraryStorage {
  async getItineraryByTrip(tripId: number): Promise<Itinerary[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('itinerary')
      .select('*')
      .eq('trip_id', tripId)
      .order('day', { ascending: true });

    if (error) throw error;

    // Transform to camelCase for consistency with other endpoints
    return (data || []).map((item: any) => ({
      id: item.id,
      tripId: item.trip_id,
      date: item.date,
      day: item.day,
      locationName: item.location_name,
      portName: item.location_name, // Keep for backward compatibility
      country: item.country,
      arrivalTime: item.arrival_time,
      departureTime: item.departure_time,
      allAboardTime: item.all_aboard_time,
      portImageUrl: item.location_image_url,
      description: item.description,
      highlights: item.highlights,
      orderIndex: item.order_index,
      segment: item.segment,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  async createItineraryStop(data: any): Promise<Itinerary> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: stop, error } = await supabaseAdmin
      .from('itinerary')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return stop;
  }

  async updateItineraryStop(id: number, data: any): Promise<Itinerary> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: stop, error } = await supabaseAdmin
      .from('itinerary')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return stop;
  }

  async deleteItineraryStop(id: number): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('itinerary').delete().eq('id', id);

    if (error) throw error;
  }

  async bulkCreateItineraryStops(data: any[]): Promise<Itinerary[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: stops, error } = await supabaseAdmin.from('itinerary').insert(data).select();

    if (error) throw error;
    return stops || [];
  }
}

// ============ EVENT STORAGE ============

export interface IEventStorage {
  getEventsByTrip(tripId: number): Promise<Event[]>;
  getEventsByDate(tripId: number, date: Date): Promise<Event[]>;
  getEventsByType(tripId: number, type: string): Promise<Event[]>;
  createEvent(data: any): Promise<Event>;
  updateEvent(id: number, data: any): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  bulkCreateEvents(data: any[]): Promise<Event[]>;
  bulkUpsertEvents(tripId: number, events: any[]): Promise<Event[]>;
}

export class EventStorage implements IEventStorage {
  async getEventsByTrip(tripId: number): Promise<Event[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getEventsByDate(tripId: number, date: Date): Promise<Event[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const dateString = date.toISOString().split('T')[0];
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('trip_id', tripId)
      .eq('date', dateString)
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getEventsByType(tripId: number, type: string): Promise<Event[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('trip_id', tripId)
      .eq('type', type)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createEvent(data: any): Promise<Event> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return event;
  }

  async updateEvent(id: number, data: any): Promise<Event> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('events').delete().eq('id', id);

    if (error) throw error;
  }

  async bulkCreateEvents(data: any[]): Promise<Event[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: events, error } = await supabaseAdmin.from('events').insert(data).select();

    if (error) throw error;
    return events || [];
  }

  async bulkUpsertEvents(tripId: number, events: any[]): Promise<Event[]> {
    const supabaseAdmin = getSupabaseAdmin();

    // Add trip_id to all events and prepare for upsert
    const eventsWithTripId = events.map((event: any) => ({ ...event, trip_id: tripId }));

    const { data: upsertedEvents, error } = await supabaseAdmin
      .from('events')
      .upsert(eventsWithTripId)
      .select();

    if (error) throw error;
    return upsertedEvents || [];
  }
}

// ============ TALENT STORAGE ============

export interface ITalentStorage {
  getAllTalent(): Promise<Talent[]>;
  getTalentById(id: number): Promise<Talent | null>;
  createTalent(data: any): Promise<Talent>;
  updateTalent(id: number, data: any): Promise<Talent>;
  deleteTalent(id: number): Promise<void>;
  getTalentByCategory(categoryId: number): Promise<Talent[]>;
  searchTalent(query: string): Promise<Talent[]>;
}

export class TalentStorage implements ITalentStorage {
  async getAllTalent(): Promise<Talent[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('talent')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getTalentById(id: number): Promise<Talent | null> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('talent').select('*').eq('id', id).single();

    if (error) return null;
    return data;
  }

  async createTalent(data: any): Promise<Talent> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: talent, error } = await supabaseAdmin
      .from('talent')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return talent;
  }

  async updateTalent(id: number, data: any): Promise<Talent> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: talent, error } = await supabaseAdmin
      .from('talent')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return talent;
  }

  async deleteTalent(id: number): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('talent').delete().eq('id', id);

    if (error) throw error;
  }

  async getTalentByCategory(categoryId: number): Promise<Talent[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('talent')
      .select('*')
      .eq('talent_category_id', categoryId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async searchTalent(query: string): Promise<Talent[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('talent')
      .select('*')
      .or(`name.ilike.%${query}%,bio.ilike.%${query}%,skills.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

// ============ SETTINGS STORAGE ============

export interface ISettingsStorage {
  getSettingsByCategory(category: string): Promise<Settings[]>;
  getActiveSettingsByCategory(category: string): Promise<Settings[]>;
  upsertSetting(category: string, key: string, data: any): Promise<Settings>;
  deactivateSetting(category: string, key: string): Promise<Settings>;
  reorderSettings(category: string, keys: string[]): Promise<void>;
}

export class SettingsStorage implements ISettingsStorage {
  async getSettingsByCategory(category: string): Promise<Settings[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('category', category)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getActiveSettingsByCategory(category: string): Promise<Settings[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async upsertSetting(category: string, key: string, data: any): Promise<Settings> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: setting, error } = await supabaseAdmin
      .from('settings')
      .upsert({
        category,
        key,
        ...data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return setting;
  }

  async deactivateSetting(category: string, key: string): Promise<Settings> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: setting, error } = await supabaseAdmin
      .from('settings')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('category', category)
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;
    return setting;
  }

  async reorderSettings(category: string, keys: string[]): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();

    for (let i = 0; i < keys.length; i++) {
      const { error } = await supabaseAdmin
        .from('settings')
        .update({
          order_index: i,
          updated_at: new Date().toISOString(),
        })
        .eq('category', category)
        .eq('key', keys[i]);

      if (error) throw error;
    }
  }
}

// ============ TRIP INFO STORAGE ============

export interface ITripInfoStorage {
  getCompleteInfo(slug: string, type: string): Promise<any>;
  assignSectionToTrip(tripId: number, sectionId: number, orderIndex: number): Promise<any>;
  updateAssignmentOrder(assignmentId: number, orderIndex: number): Promise<any>;
  removeAssignment(assignmentId: number): Promise<void>;
  getTripSections(tripId: number): Promise<any[]>;
  getGeneralSections(): Promise<any[]>;
}

export class TripInfoStorage implements ITripInfoStorage {
  async getCompleteInfo(slug: string, type: string): Promise<any> {
    const supabaseAdmin = getSupabaseAdmin();

    // Get trip data with charter company info
    const { data: tripData, error: tripError } = await supabaseAdmin
      .from('trips')
      .select(
        `
        *,
        charter_companies (
          name,
          logo_url
        )
      `
      )
      .eq('slug', slug)
      .single();

    if (tripError) throw tripError;
    if (!tripData) throw new Error('Trip not found');

    // Flatten charter company data for transformTripData
    const flattenedTripData = {
      ...tripData,
      charter_company_name: tripData.charter_companies?.name || null,
      charter_company_logo: tripData.charter_companies?.logo_url || null,
    };

    // Transform trip data to camelCase
    const tripStorage = new TripStorage();
    const transformedTrip = tripStorage.transformTripData(flattenedTripData);

    // Get itinerary data with location highlights, attractions, and LGBT venues
    const { data: itineraryData, error: itineraryError } = await supabaseAdmin
      .from('itinerary')
      .select(
        `
        *,
        location:locations(
          id,
          name,
          country,
          image_url,
          description,
          top_attractions,
          top_lgbt_venues
        )
      `
      )
      .eq('trip_id', tripData.id)
      .order('day', { ascending: true });

    // Fetch location attractions and LGBT venues for all locations in itinerary
    const locationIds = (itineraryData || [])
      .map((item: any) => item.location_id)
      .filter((id: number | null) => id !== null);

    const attractionsMap: Record<number, any[]> = {};
    const venuesMap: Record<number, any[]> = {};

    if (locationIds.length > 0) {
      // Fetch attractions
      const { data: attractionsData } = await supabaseAdmin
        .from('location_attractions')
        .select('*')
        .in('location_id', locationIds)
        .order('order_index', { ascending: true });

      // Fetch LGBT venues
      const { data: venuesData } = await supabaseAdmin
        .from('location_lgbt_venues')
        .select('*')
        .in('location_id', locationIds)
        .order('order_index', { ascending: true });

      // Group by location_id
      (attractionsData || []).forEach((attraction: any) => {
        if (!attractionsMap[attraction.location_id]) {
          attractionsMap[attraction.location_id] = [];
        }
        attractionsMap[attraction.location_id].push(attraction);
      });

      (venuesData || []).forEach((venue: any) => {
        if (!venuesMap[venue.location_id]) {
          venuesMap[venue.location_id] = [];
        }
        venuesMap[venue.location_id].push(venue);
      });
    }

    if (itineraryError) throw itineraryError;

    // Transform itinerary data to camelCase
    const transformedItinerary = (itineraryData || []).map((item: any) => {
      // Get attractions and venues for this location
      const locationAttractions = item.location_id ? attractionsMap[item.location_id] || [] : [];
      const locationLgbtVenues = item.location_id ? venuesMap[item.location_id] || [] : [];

      // Transform attractions to camelCase
      const transformedAttractions = locationAttractions.map((attr: any) => ({
        id: attr.id,
        locationId: attr.location_id,
        name: attr.name,
        description: attr.description,
        category: attr.category,
        imageUrl: attr.image_url,
        websiteUrl: attr.website_url,
        orderIndex: attr.order_index,
      }));

      // Transform LGBT venues to camelCase
      const transformedVenues = locationLgbtVenues.map((venue: any) => ({
        id: venue.id,
        locationId: venue.location_id,
        name: venue.name,
        venueType: venue.venue_type,
        description: venue.description,
        address: venue.address,
        imageUrl: venue.image_url,
        websiteUrl: venue.website_url,
        orderIndex: venue.order_index,
      }));

      return {
        id: item.id,
        tripId: item.trip_id,
        date: item.date,
        day: item.day,
        locationName: item.location_name,
        portName: item.location_name, // Keep for backward compatibility
        country: item.location?.country || null,
        arrivalTime: item.arrival_time,
        departureTime: item.departure_time,
        allAboardTime: item.all_aboard_time,
        portImageUrl: item.location_image_url,
        description: item.description,
        highlights: item.highlights,
        orderIndex: item.order_index,
        segment: item.segment,
        locationId: item.location_id,
        locationTypeId: item.location_type_id,
        location: item.location
          ? {
              id: item.location.id,
              name: item.location.name,
              country: item.location.country,
              imageUrl: item.location.image_url,
              description: item.location.description,
              topAttractions: item.location.top_attractions,
              topLgbtVenues: item.location.top_lgbt_venues,
              attractions: transformedAttractions,
              lgbtVenues: transformedVenues,
            }
          : null,
      };
    });

    // Get events data with party themes, venues, and event types
    // Note: Events can have either ship_venue_id OR resort_venue_id depending on trip type
    const { data: eventsData, error: eventsError } = await supabaseAdmin
      .from('events')
      .select(
        `
        *,
        party_themes(*),
        ship_venues(
          id,
          name,
          description,
          venue_type_id,
          venue_types(
            id,
            name
          )
        ),
        resort_venues(
          id,
          name,
          description,
          venue_type_id,
          venue_types(
            id,
            name
          )
        ),
        event_types(
          id,
          name,
          icon,
          color
        )
      `
      )
      .eq('trip_id', tripData.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (eventsError) throw eventsError;

    // Transform events data to camelCase
    const transformedEvents = (eventsData || []).map((event: any) => {
      // Handle venue data - event can have either ship_venues or resort_venues
      const venueData = event.ship_venues || event.resort_venues;
      const venueId = event.ship_venue_id || event.resort_venue_id;

      return {
        id: event.id,
        tripId: event.trip_id,
        date: event.date,
        time: event.time,
        title: event.title,
        eventTypeId: event.event_type_id,
        eventType: event.event_types
          ? {
              id: event.event_types.id,
              name: event.event_types.name,
              icon: event.event_types.icon,
              color: event.event_types.color,
            }
          : null,
        venueId: venueId,
        shipVenueId: event.ship_venue_id,
        resortVenueId: event.resort_venue_id,
        venue: venueData
          ? {
              id: venueData.id,
              name: venueData.name,
              description: venueData.description,
              venueTypeId: venueData.venue_type_id,
              venueType: venueData.venue_types
                ? {
                    id: venueData.venue_types.id,
                    name: venueData.venue_types.name,
                  }
                : null,
            }
          : null,
        // Legacy venue text field (deprecated)
        venueName: event.venue,
        deck: null, // Add if available in schema
        description: event.description,
        shortDescription: null, // Add if available in schema
        imageUrl: event.image_url,
        themeDescription: null, // Add if available in schema
        dressCode: null, // Add if available in schema
        capacity: null, // Add if available in schema
        requiresReservation: false, // Add if available in schema
        talentIds: event.talent_ids,
        partyThemeId: event.party_theme_id,
        partyTheme: event.party_themes
          ? {
              id: event.party_themes.id,
              name: event.party_themes.name,
              shortDescription: event.party_themes.short_description,
              longDescription: event.party_themes.long_description,
              costumeIdeas: event.party_themes.costume_ideas,
              amazonShoppingListUrl: event.party_themes.amazon_shopping_list_url,
              imageUrl: event.party_themes.image_url,
            }
          : null,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
      };
    });

    // Get talent data (only for this trip via trip_talent junction table)
    const { data: talentData, error: talentError } = await supabaseAdmin
      .from('trip_talent')
      .select(
        `
        talent:talent_id (
          id,
          name,
          bio,
          known_for,
          profile_image_url,
          social_links,
          website,
          created_at,
          updated_at,
          talent_categories (
            category
          )
        )
      `
      )
      .eq('trip_id', tripData.id)
      .order('talent(name)', { ascending: true });

    if (talentError) throw talentError;

    // Log for debugging
    logger.debug('Talent query completed', {
      tripId: tripData.id,
      slug,
      talentCount: talentData?.length || 0,
    });

    // Transform talent data to camelCase (extract from junction table result)
    const transformedTalent = (talentData || [])
      .map((item: any) => item.talent) // Extract talent object from junction table
      .filter((talent: any) => talent !== null) // Filter out any null values
      .map((talent: any) => ({
        id: talent.id,
        name: talent.name,
        category: talent.talent_categories?.category || 'Unknown',
        bio: talent.bio,
        knownFor: talent.known_for,
        profileImageUrl: talent.profile_image_url,
        socialLinks: talent.social_links,
        website: talent.website,
        createdAt: talent.created_at,
        updatedAt: talent.updated_at,
      }));

    // Get resort schedule data (for resort trips)
    const { data: scheduleData, error: scheduleError } = await supabaseAdmin
      .from('resort_schedules')
      .select('*')
      .eq('trip_id', tripData.id)
      .order('day_number', { ascending: true });

    if (scheduleError) throw scheduleError;

    // Transform schedule data to camelCase
    const transformedSchedule = (scheduleData || []).map((schedule: any) => ({
      id: schedule.id,
      tripId: schedule.trip_id,
      dayNumber: schedule.day_number,
      date: schedule.date,
      imageUrl: schedule.image_url,
      description: schedule.description,
      orderIndex: schedule.order_index,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at,
    }));

    // Get trip info sections via junction table
    const { data: tripInfoSectionsData, error: tripInfoError } = await supabaseAdmin
      .from('trip_section_assignments')
      .select(
        `
        id,
        order_index,
        trip_info_sections (
          id,
          title,
          content,
          section_type,
          updated_by,
          updated_at
        )
      `
      )
      .eq('trip_id', tripData.id)
      .order('order_index', { ascending: true });

    if (tripInfoError) throw tripInfoError;

    // Transform trip info sections to camelCase
    const transformedTripInfoSections = (tripInfoSectionsData || []).map((assignment: any) => ({
      id: assignment.trip_info_sections.id,
      tripId: tripData.id,
      title: assignment.trip_info_sections.title,
      content: assignment.trip_info_sections.content,
      sectionType: assignment.trip_info_sections.section_type,
      orderIndex: assignment.order_index,
      updatedBy: assignment.trip_info_sections.updated_by,
      updatedAt: assignment.trip_info_sections.updated_at,
      assignment: {
        id: assignment.id,
        tripId: tripData.id,
        orderIndex: assignment.order_index,
      },
    }));

    return {
      trip: transformedTrip,
      itinerary: transformedItinerary,
      scheduleEntries: transformedSchedule,
      events: transformedEvents,
      talent: transformedTalent,
      tripInfoSections: transformedTripInfoSections,
    };
  }

  async assignSectionToTrip(tripId: number, sectionId: number, orderIndex: number): Promise<any> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: assignment, error } = await supabaseAdmin
      .from('trip_section_assignments')
      .insert({
        trip_id: tripId,
        section_id: sectionId,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (error) throw error;
    return assignment;
  }

  async updateAssignmentOrder(assignmentId: number, orderIndex: number): Promise<any> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: assignment, error } = await supabaseAdmin
      .from('trip_section_assignments')
      .update({
        order_index: orderIndex,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return assignment;
  }

  async removeAssignment(assignmentId: number): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('trip_section_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;
  }

  async getTripSections(tripId: number): Promise<any[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: sections, error } = await supabaseAdmin
      .from('trip_section_assignments')
      .select(
        `
        id,
        order_index,
        trip_info_sections (
          id,
          title,
          content,
          section_type,
          updated_by,
          updated_at
        )
      `
      )
      .eq('trip_id', tripId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return (sections || []).map((assignment: any) => ({
      ...assignment.trip_info_sections,
      assignment: {
        id: assignment.id,
        tripId: tripId,
        orderIndex: assignment.order_index,
      },
    }));
  }

  async getGeneralSections(): Promise<any[]> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: sections, error } = await supabaseAdmin
      .from('trip_info_sections')
      .select('*')
      .eq('section_type', 'general')
      .order('title', { ascending: true });

    if (error) throw error;
    return sections || [];
  }
}

// ============ CRUISE STORAGE (Legacy Compatibility) ============

export interface ICruiseStorage {
  getCruiseById(id: number): Promise<Trip | null>;
  getCruiseBySlug(slug: string): Promise<Trip | null>;
  createCruise(data: any): Promise<Trip>;
  updateCruise(id: number, data: any): Promise<Trip>;
  deleteCruise(id: number): Promise<void>;
  getAllCruises(): Promise<Trip[]>;
  getUpcomingCruises(): Promise<Trip[]>;
  getPastCruises(): Promise<Trip[]>;
}

export class CruiseStorage implements ICruiseStorage {
  private tripStorage = new TripStorage();

  // Legacy cruise methods - redirect to trip storage for backward compatibility
  async getCruiseById(id: number): Promise<Trip | null> {
    return this.tripStorage.getTripById(id);
  }

  async getCruiseBySlug(slug: string): Promise<Trip | null> {
    return this.tripStorage.getTripBySlug(slug);
  }

  async createCruise(data: any): Promise<Trip> {
    return this.tripStorage.createTrip(data);
  }

  async updateCruise(id: number, data: any): Promise<Trip> {
    return this.tripStorage.updateTrip(id, data);
  }

  async deleteCruise(id: number): Promise<void> {
    return this.tripStorage.deleteTrip(id);
  }

  async getAllCruises(): Promise<Trip[]> {
    return this.tripStorage.getAllTrips();
  }

  async getUpcomingCruises(): Promise<Trip[]> {
    return this.tripStorage.getUpcomingTrips();
  }

  async getPastCruises(): Promise<Trip[]> {
    return this.tripStorage.getPastTrips();
  }
}

// ============ MOCK PERFORMANCE MONITORING ============

// Mock performance metrics for performance routes
export async function getPerformanceMetrics() {
  const startTime = Date.now();
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Simple health check query
    const { data, error } = await supabaseAdmin.from('profiles').select('id').limit(1);

    const duration = Date.now() - startTime;

    return {
      database: {
        status: error ? 'error' : 'healthy',
        responseTime: duration,
        averageDuration: duration,
        error: error?.message,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      database: {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Mock cache warmup
export async function warmUpCaches() {
  // Warm up by running common queries
  const supabaseAdmin = getSupabaseAdmin();

  try {
    await Promise.all([
      supabaseAdmin.from('trips').select('id').limit(5),
      supabaseAdmin.from('locations').select('id').limit(5),
      supabaseAdmin.from('talent').select('id').limit(5),
    ]);
    return true;
  } catch (error: unknown) {
    logger.error('Cache warmup failed', error);
    return false;
  }
}

// Mock optimized connection for performance monitoring
export const optimizedConnection = {
  async getPoolStats() {
    // Return mock pool stats for Supabase (pooling is handled internally)
    return {
      total: 10,
      active: 2,
      idle: 8,
      waiting: 0,
    };
  },

  getMetrics() {
    // Return mock metrics
    return {
      slowQueries: [], // Supabase doesn't expose query logs directly
      averageDuration: 50,
      totalQueries: 100,
    };
  },
};

// ============ STORAGE INSTANCES ============

export const profileStorage = new ProfileStorage();
export const storage = new ProfileStorage(); // Legacy alias
export const tripStorage = new TripStorage();
export const cruiseStorage = new CruiseStorage(); // Legacy compatibility
export const itineraryStorage = new ItineraryStorage();
export const eventStorage = new EventStorage();
export const talentStorage = new TalentStorage();
export const settingsStorage = new SettingsStorage();
export const tripInfoStorage = new TripInfoStorage();

// Database instance (for backward compatibility)
export const db = {
  // Mock database interface for any remaining direct db calls
  execute: async (query: string) => {
    logger.warn('Direct database execute called', { query });
    return { rows: [] };
  },
};

// Re-export location storage (already Supabase-based)
export {
  locationStorage,
  type Location,
  type NewLocation,
} from './storage/LocationStorage-Supabase';
