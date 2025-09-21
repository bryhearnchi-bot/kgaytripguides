/**
 * Database Test Fixtures
 * Pre-defined test data for consistent testing
 */

import type {
  Trip,
  Event,
  Talent,
  Itinerary,
  Media,
  Settings,
  Port,
  Party,
  EventTalent,
  Profile
} from '../../shared/schema';

// ============ PROFILE FIXTURES ============

export const profileFixtures = {
  admin: {
    id: 'admin-1',
    email: 'admin@atlantis.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSignInAt: new Date('2024-01-01'),
  } as Profile,

  user: {
    id: 'user-1',
    email: 'user@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSignInAt: new Date('2024-01-01'),
  } as Profile,

  inactive: {
    id: 'inactive-1',
    email: 'inactive@example.com',
    username: 'inactive',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'user',
    isActive: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSignInAt: new Date('2024-01-01'),
  } as Profile,
};

// ============ TRIP FIXTURES ============

export const tripFixtures = {
  upcoming: {
    id: 1,
    title: 'Mediterranean Gay Cruise 2024',
    slug: 'mediterranean-gay-cruise-2024',
    description: 'Join us for an unforgettable journey through the Mediterranean',
    shortDescription: '7-day Mediterranean adventure',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-08'),
    status: 'published',
    capacity: 500,
    currentBookings: 250,
    price: 2500,
    shipName: 'Atlantis Explorer',
    departurePort: 'Athens, Greece',
    featuredImage: 'https://storage.supabase.co/atlantis/cruise1.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Trip,

  past: {
    id: 2,
    title: 'Caribbean Pride Voyage 2023',
    slug: 'caribbean-pride-voyage-2023',
    description: 'Our most successful Caribbean cruise',
    shortDescription: '10-day Caribbean celebration',
    startDate: new Date('2023-11-01'),
    endDate: new Date('2023-11-11'),
    status: 'past',
    capacity: 600,
    currentBookings: 600,
    price: 3000,
    shipName: 'Rainbow Voyager',
    departurePort: 'Fort Lauderdale, FL',
    featuredImage: 'https://storage.supabase.co/atlantis/cruise2.jpg',
    createdAt: new Date('2023-08-01'),
    updatedAt: new Date('2023-11-12'),
  } as Trip,

  draft: {
    id: 3,
    title: 'Alaska Adventure 2025',
    slug: 'alaska-adventure-2025',
    description: 'Exploring the Last Frontier',
    shortDescription: '14-day Alaska expedition',
    startDate: new Date('2025-07-15'),
    endDate: new Date('2025-07-29'),
    status: 'draft',
    capacity: 400,
    currentBookings: 0,
    price: 4500,
    shipName: 'Northern Star',
    departurePort: 'Seattle, WA',
    featuredImage: 'https://storage.supabase.co/atlantis/cruise3.jpg',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  } as Trip,
};

// ============ PORT FIXTURES ============

export const portFixtures = {
  athens: {
    id: 1,
    name: 'Athens (Piraeus)',
    country: 'Greece',
    region: 'Mediterranean',
    port_type: 'embarkation' as const,
    coordinates: { lat: 37.9838, lng: 23.7275 },
    description: 'The ancient city where democracy was born',
    image_url: 'https://storage.supabase.co/atlantis/ports/athens.jpg',
  },

  santorini: {
    id: 2,
    name: 'Santorini',
    country: 'Greece',
    region: 'Mediterranean',
    port_type: 'port' as const,
    coordinates: { lat: 36.3932, lng: 25.4615 },
    description: 'Famous for its stunning sunsets and white-washed buildings',
    image_url: 'https://storage.supabase.co/atlantis/ports/santorini.jpg',
  },

  kusadasi: {
    id: 3,
    name: 'Kuşadası',
    country: 'Turkey',
    region: 'Mediterranean',
    port_type: 'port' as const,
    coordinates: { lat: 37.8587, lng: 27.2597 },
    description: 'Gateway to ancient Ephesus',
    image_url: 'https://storage.supabase.co/atlantis/ports/kusadasi.jpg',
  },

  seaDay: {
    id: 4,
    name: 'Sea Day',
    country: '',
    region: 'Mediterranean',
    port_type: 'sea_day' as const,
    coordinates: null,
    description: 'Enjoy a full day of onboard activities',
    image_url: 'https://storage.supabase.co/atlantis/sea-day.jpg',
  },
};

// ============ EVENT FIXTURES ============

export const eventFixtures = {
  welcomeParty: {
    id: 1,
    cruiseId: 1,
    title: 'Welcome Aboard Party',
    description: 'Kick off your cruise with style!',
    type: 'party',
    date: new Date('2024-06-01'),
    time: '19:00',
    duration: 3,
    location: 'Pool Deck',
    capacity: 400,
    isRecurring: false,
    imageUrl: 'https://storage.supabase.co/atlantis/events/welcome.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Event,

  whiteParty: {
    id: 2,
    cruiseId: 1,
    title: 'White Party',
    description: 'Dress in your finest white attire',
    type: 'party',
    date: new Date('2024-06-03'),
    time: '22:00',
    duration: 4,
    location: 'Main Theater',
    capacity: 500,
    isRecurring: false,
    imageUrl: 'https://storage.supabase.co/atlantis/events/white-party.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Event,

  dragsShow: {
    id: 3,
    cruiseId: 1,
    title: 'Drag Extravaganza',
    description: 'Our fabulous queens take the stage',
    type: 'show',
    date: new Date('2024-06-04'),
    time: '21:30',
    duration: 2,
    location: 'Main Theater',
    capacity: 600,
    isRecurring: false,
    imageUrl: 'https://storage.supabase.co/atlantis/events/drag-show.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Event,
};

// ============ TALENT FIXTURES ============

export const talentFixtures = {
  dj: {
    id: 1,
    name: 'DJ Fabulous',
    category: 'DJ',
    bio: 'International DJ known for epic dance parties',
    knownFor: 'Circuit parties and tribal beats',
    profileImageUrl: 'https://storage.supabase.co/atlantis/talent/dj-fabulous.jpg',
    socialLinks: {
      instagram: '@djfabulous',
      twitter: '@djfabulous',
      facebook: 'DJFabulous'
    },
    website: 'https://djfabulous.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Talent,

  dragQueen: {
    id: 2,
    name: 'Miss Tina Tension',
    category: 'Drag Performer',
    bio: 'Award-winning drag performer and comedian',
    knownFor: 'Hilarious comedy shows and stunning performances',
    profileImageUrl: 'https://storage.supabase.co/atlantis/talent/tina-tension.jpg',
    socialLinks: {
      instagram: '@misstension',
      tiktok: '@tinatension'
    },
    website: 'https://tinatension.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Talent,

  singer: {
    id: 3,
    name: 'Alexander James',
    category: 'Singer',
    bio: 'Broadway performer with a powerful voice',
    knownFor: 'Broadway classics and pop anthems',
    profileImageUrl: 'https://storage.supabase.co/atlantis/talent/alexander-james.jpg',
    socialLinks: {
      instagram: '@alexanderjamesmusic',
      youtube: 'AlexanderJamesOfficial'
    },
    website: 'https://alexanderjames.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Talent,
};

// ============ PARTY FIXTURES ============

export const partyFixtures = {
  whiteParty: {
    id: 1,
    name: 'Classic White Party',
    theme: 'All White Attire Required',
    venue_type: 'pool' as const,
    capacity: 500,
    duration_hours: 4,
    requirements: ['DJ', 'Sound System', 'White Lighting', 'Photo Booth'],
    image_url: 'https://storage.supabase.co/atlantis/parties/white-party.jpg',
    usage_count: 15,
  },

  poolParty: {
    id: 2,
    name: 'Tropical Pool Party',
    theme: 'Tropical Paradise',
    venue_type: 'pool' as const,
    capacity: 300,
    duration_hours: 3,
    requirements: ['DJ', 'Poolside Bar', 'Tropical Decor'],
    image_url: 'https://storage.supabase.co/atlantis/parties/pool-party.jpg',
    usage_count: 8,
  },

  underwearParty: {
    id: 3,
    name: 'Underwear Party',
    theme: 'Express Yourself',
    venue_type: 'club' as const,
    capacity: 400,
    duration_hours: 5,
    requirements: ['DJ', 'Special Lighting', 'Security', 'Coat Check'],
    image_url: 'https://storage.supabase.co/atlantis/parties/underwear-party.jpg',
    usage_count: 12,
  },
};

// ============ ITINERARY FIXTURES ============

export const itineraryFixtures = {
  day1: {
    id: 1,
    cruiseId: 1,
    portId: 1,
    date: new Date('2024-06-01'),
    arrivalTime: '00:00',
    departureTime: '18:00',
    orderIndex: 0,
    isSeaDay: false,
    activities: ['Embarkation', 'Muster Drill', 'Welcome Reception'],
    notes: 'Boarding begins at 12:00 PM',
  } as Itinerary,

  day2: {
    id: 2,
    cruiseId: 1,
    portId: 4, // Sea Day
    date: new Date('2024-06-02'),
    arrivalTime: null,
    departureTime: null,
    orderIndex: 1,
    isSeaDay: true,
    activities: ['Pool Parties', 'Fitness Classes', 'Entertainment Shows'],
    notes: 'Full day of onboard activities',
  } as Itinerary,

  day3: {
    id: 3,
    cruiseId: 1,
    portId: 2, // Santorini
    date: new Date('2024-06-03'),
    arrivalTime: '08:00',
    departureTime: '18:00',
    orderIndex: 2,
    isSeaDay: false,
    activities: ['Island Tour', 'Wine Tasting', 'Sunset Views'],
    notes: 'Tender port - weather dependent',
  } as Itinerary,
};

// ============ SETTINGS FIXTURES ============

export const settingsFixtures = {
  appName: {
    id: 1,
    category: 'general',
    key: 'app_name',
    value: 'Atlantis Events',
    label: 'Application Name',
    description: 'The name displayed in the application',
    type: 'string',
    isActive: true,
    orderIndex: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Settings,

  emailNotifications: {
    id: 2,
    category: 'notifications',
    key: 'email_enabled',
    value: 'true',
    label: 'Email Notifications',
    description: 'Enable email notifications for bookings',
    type: 'boolean',
    isActive: true,
    orderIndex: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Settings,

  maxCapacity: {
    id: 3,
    category: 'booking',
    key: 'max_capacity',
    value: '600',
    label: 'Maximum Capacity',
    description: 'Maximum number of passengers per cruise',
    type: 'number',
    isActive: true,
    orderIndex: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Settings,
};

// ============ COMPREHENSIVE TEST SCENARIOS ============

export const testScenarios = {
  // Full trip with all related data
  completeTripScenario: {
    trip: tripFixtures.upcoming,
    ports: [portFixtures.athens, portFixtures.santorini, portFixtures.kusadasi],
    events: [eventFixtures.welcomeParty, eventFixtures.whiteParty, eventFixtures.dragsShow],
    talent: [talentFixtures.dj, talentFixtures.dragQueen, talentFixtures.singer],
    itinerary: [itineraryFixtures.day1, itineraryFixtures.day2, itineraryFixtures.day3],
  },

  // User authentication scenarios
  authScenarios: {
    validAdmin: profileFixtures.admin,
    validUser: profileFixtures.user,
    inactiveUser: profileFixtures.inactive,
  },

  // Error scenarios
  errorScenarios: {
    invalidTripId: 999999,
    invalidUserId: 'invalid-user-id',
    pastDates: {
      startDate: new Date('2020-01-01'),
      endDate: new Date('2020-01-08'),
    },
    futureDates: {
      startDate: new Date('2030-01-01'),
      endDate: new Date('2030-01-08'),
    },
  },
};

// ============ FIXTURE LOADING HELPERS ============

export class FixtureLoader {
  static async loadTrip(db: any, fixture: any = tripFixtures.upcoming): Promise<any> {
    const result = await db.insert('cruises').values(fixture).returning();
    return result[0];
  }

  static async loadEvent(db: any, fixture: any = eventFixtures.welcomeParty): Promise<any> {
    const result = await db.insert('events').values(fixture).returning();
    return result[0];
  }

  static async loadTalent(db: any, fixture: any = talentFixtures.dj): Promise<any> {
    const result = await db.insert('talent').values(fixture).returning();
    return result[0];
  }

  static async loadPort(db: any, fixture: any = portFixtures.athens): Promise<any> {
    const result = await db.insert('ports').values(fixture).returning();
    return result[0];
  }

  static async loadCompleteScenario(db: any): Promise<any> {
    const scenario = testScenarios.completeTripScenario;

    // Load in dependency order
    const trip = await this.loadTrip(db, scenario.trip);
    const ports = await Promise.all(
      scenario.ports.map(port => this.loadPort(db, port))
    );
    const events = await Promise.all(
      scenario.events.map(event => this.loadEvent(db, {
        ...event,
        cruiseId: trip.id
      }))
    );
    const talent = await Promise.all(
      scenario.talent.map(t => this.loadTalent(db, t))
    );

    return { trip, ports, events, talent };
  }

  static async cleanup(db: any): Promise<void> {
    // Clean up in reverse dependency order
    await db.delete('event_talent');
    await db.delete('cruise_talent');
    await db.delete('itinerary');
    await db.delete('events');
    await db.delete('talent');
    await db.delete('ports');
    await db.delete('cruises');
    await db.delete('profiles');
  }
}

export { FixtureLoader as fixtures };