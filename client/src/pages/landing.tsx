import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Ship, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface Cruise {
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

function CruiseCard({ cruise }: { cruise: Cruise }) {
  const startDate = new Date(cruise.startDate);
  const endDate = new Date(cruise.endDate);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative overflow-hidden">
        <img
          src={cruise.heroImageUrl || "/images/cruises/default-hero.jpg"}
          alt={cruise.name}
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "/images/ships/resilient-lady-hero.jpg";
          }}
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-900">
            {cruise.status === "upcoming" ? "Upcoming" : cruise.status}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {cruise.name}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {cruise.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Ship className="h-4 w-4" />
            <span>{cruise.shipName} • {cruise.cruiseLine}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4" />
            <span>
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")} • {duration} days
            </span>
          </div>
          
          {cruise.highlights && cruise.highlights.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{cruise.highlights[0]}</span>
            </div>
          )}
        </div>
        
        <Link href={`/cruise/${cruise.slug}`}>
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            View Cruise Guide
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function LandingPage() {
  const { data: cruises, isLoading, error } = useQuery<Cruise[]>({
    queryKey: ["cruises"],
    queryFn: async () => {
      const response = await fetch("/api/cruises");
      if (!response.ok) {
        throw new Error("Failed to fetch cruises");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amazing cruises...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load cruises</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Separate upcoming and past cruises
  const upcomingCruises = cruises?.filter(cruise => cruise.status === "upcoming") || [];
  const pastCruises = cruises?.filter(cruise => cruise.status === "past") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/images/atlantis-logo.png" alt="Atlantis Events" className="h-12" />
          </div>
          <h1 className="text-5xl font-bold mb-6">
            Epic Gay Cruise Adventures
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of men from around the world for unforgettable cruise experiences. 
            From the Mediterranean to the Caribbean, discover your next amazing adventure.
          </p>
          <div className="flex items-center justify-center gap-6 text-blue-200">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>All-Gay Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              <span>Luxury Ships</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Amazing Destinations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Upcoming Cruises */}
        {upcomingCruises.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Upcoming Cruises</h2>
              <p className="text-lg text-gray-600">Book your next adventure today</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingCruises.map((cruise) => (
                <CruiseCard key={cruise.id} cruise={cruise} />
              ))}
            </div>
          </section>
        )}

        {/* Past Cruises */}
        {pastCruises.length > 0 && (
          <section>
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Past Adventures</h2>
              <p className="text-lg text-gray-600">Relive the memories</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastCruises.map((cruise) => (
                <CruiseCard key={cruise.id} cruise={cruise} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!cruises || cruises.length === 0 && (
          <div className="text-center py-20">
            <Ship className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Cruises Available</h2>
            <p className="text-gray-600">Check back soon for exciting new cruise announcements!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/images/atlantis-logo.png" alt="Atlantis Events" className="h-8" />
          </div>
          <p className="text-gray-400">
            Creating unforgettable experiences for the LGBTQ+ community worldwide
          </p>
        </div>
      </footer>
    </div>
  );
}