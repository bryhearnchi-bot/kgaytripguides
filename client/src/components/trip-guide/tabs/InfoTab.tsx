import React, { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Info,
  Utensils,
  Music,
  Lightbulb,
  Ship,
  Clock,
  MapPin,
  HelpCircle,
  Search,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IMPORTANT_INFO } from '@/data/trip-data';
import { InfoSectionsBentoGrid } from '../info-sections/InfoSectionsBentoGrid';
import { TabHeader } from '../shared/TabHeader';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  section_type: string;
  created_at: string;
  updated_at: string;
  assignment?: {
    id: number;
    trip_id: number;
    order_index: number;
  };
}

interface InfoTabProps {
  IMPORTANT_INFO: typeof IMPORTANT_INFO;
  tripId?: number;
}

export const InfoTab = memo(function InfoTab({ IMPORTANT_INFO, tripId }: InfoTabProps) {
  const [subTab, setSubTab] = useState<'info' | 'faq'>('info');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch FAQs
  const {
    data: faqs,
    isLoading: faqsLoading,
    error: faqsError,
  } = useQuery<FAQ[]>({
    queryKey: ['trip-faqs', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const response = await api.get(`/api/faqs/trip/${tripId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!tripId,
  });

  // Filter FAQs based on search term
  const filteredFaqs = useMemo(() => {
    if (!faqs) return [];
    if (!searchTerm.trim()) return faqs;

    const search = searchTerm.toLowerCase();
    return faqs.filter(
      faq =>
        faq.question.toLowerCase().includes(search) || faq.answer.toLowerCase().includes(search)
    );
  }, [faqs, searchTerm]);

  // Render Info content
  const renderInfoContent = () => {
    // If tripId is provided, use the new database-driven bento grid
    if (tripId) {
      return (
        <div className="max-w-6xl mx-auto space-y-6 pt-4">
          <InfoSectionsBentoGrid tripId={tripId} />
        </div>
      );
    }

    // Legacy fallback for hardcoded IMPORTANT_INFO
    // Early return if no data
    if (!IMPORTANT_INFO || Object.keys(IMPORTANT_INFO).length === 0) {
      return (
        <div className="max-w-6xl mx-auto space-y-4 pt-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl text-center py-8 border border-white/20">
            <Info className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No information available</h3>
            <p className="text-white/70">Trip information will be available soon.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto space-y-4 pt-4">
        <div className="space-y-4">
          {/* First Day Tips */}
          {IMPORTANT_INFO.firstDayTips && IMPORTANT_INFO.firstDayTips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-r from-ocean-600 to-ocean-400 p-3">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">First Day Tips</h3>
                  </div>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {IMPORTANT_INFO.firstDayTips.map((tip, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                        className="flex items-start space-x-2"
                      >
                        <Badge
                          variant="secondary"
                          className="bg-ocean-100 text-ocean-700 mt-0.5 flex-shrink-0"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-gray-700 text-sm">{tip}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Entertainment Info */}
          {IMPORTANT_INFO.entertainment && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-r from-coral to-pink-500 p-3">
                  <div className="flex items-center space-x-2">
                    <Music className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">Entertainment Booking</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-ocean-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Booking Opens</p>
                      <p className="text-sm text-gray-600">
                        {IMPORTANT_INFO.entertainment.bookingStart}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-ocean-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Walk-Ins Welcome</p>
                      <p className="text-sm text-gray-600">
                        {IMPORTANT_INFO.entertainment.walkIns}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-ocean-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Standby Release</p>
                      <p className="text-sm text-gray-600">
                        {IMPORTANT_INFO.entertainment.standbyRelease}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Ship className="w-5 h-5 text-ocean-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">RockStar Suites</p>
                      <p className="text-sm text-gray-600">
                        {IMPORTANT_INFO.entertainment.rockstarSuites}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Dining Info */}
          {IMPORTANT_INFO.dining && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.2 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-r from-ocean-600 to-ocean-400 p-3">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">Dining Information</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-ocean-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Reservations</p>
                      <p className="text-sm text-gray-600">{IMPORTANT_INFO.dining.reservations}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-ocean-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Walk-In Tables</p>
                      <p className="text-sm text-gray-600">{IMPORTANT_INFO.dining.walkIns}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Badge
                      variant="secondary"
                      className="bg-ocean-100 text-ocean-700 mt-0.5 flex-shrink-0"
                    >
                      <span className="text-xs">Included</span>
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        All Restaurants Included
                      </p>
                      <p className="text-sm text-gray-600">{IMPORTANT_INFO.dining.included}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-ocean-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Late Night Dining</p>
                      <p className="text-sm text-gray-600">{IMPORTANT_INFO.dining.lateNight}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Virgin App Info */}
          {IMPORTANT_INFO.virginApp && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.3 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-r from-coral to-pink-500 p-3">
                  <div className="flex items-center space-x-2">
                    <Ship className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">Virgin Voyages App</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-ocean-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Registration Steps</p>
                      <p className="text-sm text-gray-600">
                        {IMPORTANT_INFO.virginApp.registrationSteps} steps to complete
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800 font-medium flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{IMPORTANT_INFO.virginApp.note}</span>
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  // Render FAQ content
  const renderFAQContent = () => {
    if (faqsLoading) {
      return (
        <div className="max-w-6xl mx-auto space-y-4 pt-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
            <p className="text-white/70">Loading FAQs...</p>
          </div>
        </div>
      );
    }

    if (faqsError) {
      return (
        <div className="max-w-6xl mx-auto space-y-4 pt-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
            <HelpCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Failed to load FAQs</h3>
            <p className="text-white/70">Please try refreshing the page</p>
          </div>
        </div>
      );
    }

    if (!faqs || faqs.length === 0) {
      return (
        <div className="max-w-6xl mx-auto space-y-4 pt-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
            <HelpCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No FAQs available</h3>
            <p className="text-white/70">
              Check back later for frequently asked questions about this trip
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto space-y-4 pt-4">
        {/* Search Input - Full width on mobile, half width on tablet/desktop */}
        <div className="w-full md:w-1/2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {filteredFaqs.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
            <HelpCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
            <p className="text-white/70">Try adjusting your search term</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-md border border-white/20 overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id}
                  value={`faq-${faq.id}`}
                  className={`border-b border-white/10 ${index === filteredFaqs.length - 1 ? 'border-b-0' : ''}`}
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:bg-white/5 transition-colors">
                    <span className="text-white font-semibold text-base pr-4">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-0">
                    <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="max-w-6xl mx-auto pt-6 pb-2">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Information</h3>
          <div className="flex-1 h-px bg-white/20 mx-3"></div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('info')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              subTab === 'info'
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setSubTab('faq')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              subTab === 'faq'
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            FAQs
          </button>
        </div>
      </div>

      {subTab === 'info' ? renderInfoContent() : renderFAQContent()}
    </>
  );
});
