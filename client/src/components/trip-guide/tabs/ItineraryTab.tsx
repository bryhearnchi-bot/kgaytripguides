import React, { memo } from "react";
import { motion } from "framer-motion";
import { Map, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dateOnly } from "@/lib/utils";

interface ItineraryTabProps {
  ITINERARY: any[];
  onViewEvents: (dateKey: string, portName: string) => void;
}

export const ItineraryTab = memo(function ItineraryTab({ ITINERARY, onViewEvents }: ItineraryTabProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
      <div className="flex items-center space-x-2 mb-2 -mt-2">
        <Map className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Itinerary</h2>
      </div>
      {ITINERARY.length === 0 ? (
        <div className="bg-white/85 backdrop-blur-sm rounded-md p-6 shadow-sm text-center py-8 border border-white/30">
          <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No itinerary available</h3>
          <p className="text-gray-500">Itinerary information will be available soon.</p>
        </div>
      ) : (
        <div>
          {ITINERARY.map((stop, index) => (
            <motion.div
              key={stop.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.02 }}
              className="mb-6"
            >
              <div
                className="bg-gray-100 border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
                onClick={() => stop.key && onViewEvents(stop.key, stop.port)}
              >
                <div className="absolute top-3 right-3 z-10">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (stop.key) onViewEvents(stop.key, stop.port);
                    }}
                    className="bg-ocean-600 hover:bg-ocean-700 text-white text-xs px-4 py-2"
                  >
                    View Events
                  </Button>
                </div>

                <div className="flex flex-col lg:flex-row">
                  <div className="w-full h-48 lg:w-48 lg:h-32 flex-shrink-0 overflow-hidden">
                    <img
                      src={stop.imageUrl || 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg'}
                      alt={stop.port}
                      className="w-full h-full object-cover"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg';
                      }}
                    />
                  </div>

                  <div className="flex-1 p-3 lg:p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-3 mb-3">
                      <div className="bg-ocean-100 text-ocean-700 text-sm font-bold px-3 py-1 rounded-full self-start">
                        <span className="lg:hidden">
                          {dateOnly((stop as any).rawDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="hidden lg:inline">
                          {dateOnly((stop as any).rawDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center min-w-0">
                        <MapPin className="w-4 h-4 text-gray-600 mr-1 flex-shrink-0" />
                        <span className="text-base font-bold text-gray-900 break-words">{stop.port}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm mb-3">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                        {stop.arrive !== '—' && (
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="font-medium text-gray-700 whitespace-nowrap">Arrive:</span>
                            <span className="font-bold text-gray-800 break-words">{stop.arrive}</span>
                          </div>
                        )}
                        {stop.depart !== '—' && (
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="font-medium text-gray-700 whitespace-nowrap">Depart:</span>
                            <span className="font-bold text-gray-800 break-words">{stop.depart}</span>
                          </div>
                        )}
                      </div>
                      {stop.allAboard && stop.allAboard !== '—' && (
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="font-bold text-gray-700 whitespace-nowrap">All Aboard:</span>
                          <span className="bg-gradient-to-r from-coral to-pink-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
                            {stop.allAboard}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
});