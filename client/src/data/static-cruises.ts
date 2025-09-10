// Static cruise data for deployment
export interface StaticCruise {
  id: number;
  name: string;
  slug: string;
  shipName: string;
  cruiseLine: string;
  startDate: string;
  endDate: string;
  status: string;
  heroImageUrl: string | null;
  description: string | null;
  highlights: string[] | null;
}

export const STATIC_CRUISES: StaticCruise[] = [
  {
    id: 7,
    name: "Alaska Wilderness Past",
    slug: "alaska-wilderness-2025",
    shipName: "Virgin Resilient Lady",
    cruiseLine: "Virgin Voyages",
    startDate: "2025-07-01T00:00:00Z",
    endDate: "2025-07-11T00:00:00Z",
    status: "past",
    heroImageUrl: "/cruise-images/virgin-resilient-lady.jpg",
    description: "Completed journey through the Last Frontier",
    highlights: ["Juneau", "Ketchikan", "Glacier Bay"]
  },
  {
    id: 1,
    name: "Greek Isles Atlantis Cruise",
    slug: "greek-isles-2025",
    shipName: "Virgin Resilient Lady",
    cruiseLine: "Virgin Voyages",
    startDate: "2025-08-19T00:00:00Z",
    endDate: "2025-08-30T00:00:00Z",
    status: "past",
    heroImageUrl: "/cruise-images/greek-isles-resilient-lady.jpg",
    description: "Join us for an unforgettable journey through the Greek Isles aboard the Virgin Resilient Lady. Experience ancient wonders, stunning beaches, and legendary Atlantis parties.",
    highlights: [
      "Visit iconic Greek islands including Mykonos and Santorini",
      "Explore ancient ruins in Athens and Ephesus",
      "Legendary Atlantis parties and entertainment",
      "World-class talent and performances",
      "All-gay vacation experience"
    ]
  },
  {
    id: 5,
    name: "Mediterranean Dreams Current",
    slug: "mediterranean-dreams-2025",
    shipName: "Virgin Resilient Lady",
    cruiseLine: "Virgin Voyages",
    startDate: "2025-09-08T00:00:00Z",
    endDate: "2025-09-18T00:00:00Z",
    status: "current",
    heroImageUrl: "/cruise-images/virgin-resilient-lady.jpg",
    description: "Currently sailing through the beautiful Mediterranean",
    highlights: ["Santorini", "Mykonos", "Crete"]
  },
  {
    id: 6,
    name: "Caribbean Adventure Upcoming",
    slug: "caribbean-adventure-2025",
    shipName: "Virgin Resilient Lady",
    cruiseLine: "Virgin Voyages",
    startDate: "2025-12-15T00:00:00Z",
    endDate: "2025-12-25T00:00:00Z",
    status: "upcoming",
    heroImageUrl: "/cruise-images/virgin-resilient-lady.jpg",
    description: "Upcoming tropical paradise adventure",
    highlights: ["Barbados", "St. Lucia", "Martinique"]
  }
];

// Function to determine cruise status based on dates
function getCruiseStatus(startDate: string, endDate: string): 'upcoming' | 'current' | 'past' {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now <= end) {
    return 'current';
  } else {
    return 'past';
  }
}

// Update cruise statuses based on current date
export const getCruises = (): StaticCruise[] => {
  return STATIC_CRUISES.map(cruise => ({
    ...cruise,
    status: getCruiseStatus(cruise.startDate, cruise.endDate)
  }));
};

// Get cruise by slug
export const getCruiseBySlug = (slug: string): StaticCruise | undefined => {
  const cruise = STATIC_CRUISES.find(c => c.slug === slug);
  if (!cruise) return undefined;
  
  return {
    ...cruise,
    status: getCruiseStatus(cruise.startDate, cruise.endDate)
  };
};