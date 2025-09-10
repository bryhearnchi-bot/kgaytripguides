import { ItineraryStop, Talent, DailySchedule, PartyTheme, CityAttraction } from './cruise-data';

// Mock data for testing purposes only - simplified test cruise
export const MOCK_ITINERARY: ItineraryStop[] = [
  { key: "2024-01-01", date: "Mon, Jan 1", port: "Test Port A", arrive: "9:00 AM", depart: "6:00 PM" },
  { key: "2024-01-02", date: "Tue, Jan 2", port: "Test Port B", arrive: "8:00 AM", depart: "5:00 PM" },
  { key: "2024-01-03", date: "Wed, Jan 3", port: "Test Port C", arrive: "10:00 AM", depart: "7:00 PM" },
];

export const MOCK_TALENT: Talent[] = [
  {
    name: "Test Artist 1",
    cat: "DJ",
    role: "Headliner",
    knownFor: "Test Mix Sessions",
    bio: "Mock bio for testing purposes.",
    img: "/images/talent/placeholder.jpg",
    social: {
      instagram: "https://instagram.com/test1"
    }
  },
  {
    name: "Test Artist 2", 
    cat: "Performer",
    role: "Featured",
    knownFor: "Mock Performances",
    bio: "Another mock bio for testing.",
    img: "/images/talent/placeholder.jpg"
  }
];

export const MOCK_DAILY: DailySchedule[] = [
  {
    key: "2024-01-01",
    items: [
      { type: "Party", time: "10:00 PM", title: "Mock Party Event", venue: "Test Deck" },
      { type: "Show", time: "8:00 PM", title: "Mock Performance", venue: "Test Theater" }
    ]
  }
];

export const MOCK_PARTY_THEMES: PartyTheme[] = [
  { 
    key: "Test Theme 1", 
    desc: "Mock party theme for testing purposes.",
    shortDesc: "Test theme for development."
  },
  { 
    key: "Test Theme 2", 
    desc: "Another mock party theme for testing.",
    shortDesc: "Second test theme."
  }
];

export const MOCK_CITY_ATTRACTIONS: CityAttraction[] = [
  {
    city: "Test Port A",
    topAttractions: ["Mock Attraction 1", "Mock Attraction 2"],
    otherThingsToDo: ["Test Activity 1", "Test Activity 2"],
    gayBars: ["Mock Bar 1: Test Address", "Mock Bar 2: Test Address"]
  }
];