import React, { memo, useState, useMemo, useEffect } from 'react';
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
  ChevronDown,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IMPORTANT_INFO } from '@/data/trip-data';
import { InfoSectionsBentoGrid } from '../info-sections/InfoSectionsBentoGrid';
import { TabHeader } from '../shared/TabHeader';
import { useQuery } from '@tanstack/react-query';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface InfoSection {
  id: number;
  title: string;
  content: string | null;
  section_type: 'trip_specific' | 'general' | 'always';
  updated_by: string | null;
  updated_at: string;
  assignment_id: number | null;
  order_index: number;
  is_always: boolean;
  is_assigned: boolean;
}

interface InfoTabProps {
  IMPORTANT_INFO: typeof IMPORTANT_INFO;
  tripId?: number;
}

// Color gradient options for info section top bars
const colorGradients = [
  'from-cyan-400 to-blue-500',
  'from-orange-400 to-red-500',
  'from-green-400 to-emerald-500',
  'from-purple-400 to-pink-500',
  'from-yellow-400 to-orange-500',
  'from-teal-400 to-cyan-500',
];

export const InfoTab = memo(function InfoTab({ IMPORTANT_INFO, tripId }: InfoTabProps) {
  const [subTab, setSubTab] = useState<'info' | 'faq'>('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [openInfoSections, setOpenInfoSections] = useState<Set<number>>(new Set());

  // Scroll to top when sub-tab changes
  useEffect(() => {
    // Try multiple methods to ensure scrolling works
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [subTab]);

  // Fetch FAQs
  const {
    data: faqs,
    isLoading: faqsLoading,
    error: faqsError,
  } = useQuery<FAQ[]>({
    queryKey: ['trip-faqs', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      // Use fetch() directly for offline cache compatibility
      // api.get() adds credentials: 'include' which prevents cache matching
      const response = await fetch(`/api/faqs/trip/${tripId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!tripId,
  });

  // Fetch Info Sections
  const {
    data: infoSections,
    isLoading: infoLoading,
    error: infoError,
  } = useQuery<InfoSection[]>({
    queryKey: ['trip-info-sections-comprehensive', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const response = await fetch(`/api/trip-info-sections/trip/${tripId}/all`);
      if (!response.ok) {
        throw new Error('Failed to fetch trip info sections');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!tripId,
  });

  // Sort info sections
  const sortedInfoSections = useMemo(() => {
    if (!infoSections) return [];
    return [...infoSections].sort((a, b) => {
      if (a.is_always && !b.is_always) return -1;
      if (!a.is_always && b.is_always) return 1;
      if (a.order_index !== b.order_index) {
        return a.order_index - b.order_index;
      }
      return a.title.localeCompare(b.title);
    });
  }, [infoSections]);

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

  // Filter Info Sections based on search term
  const filteredInfoSections = useMemo(() => {
    if (!sortedInfoSections) return [];
    if (!searchTerm.trim()) return sortedInfoSections;

    const search = searchTerm.toLowerCase();
    return sortedInfoSections.filter(
      section =>
        section.title.toLowerCase().includes(search) ||
        (section.content && section.content.toLowerCase().includes(search))
    );
  }, [sortedInfoSections, searchTerm]);

  // Check if we're in search mode (showing combined results)
  const isSearchMode = searchTerm.trim().length > 0;

  // Toggle info section open/close
  const toggleInfoSection = (id: number) => {
    setOpenInfoSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Render a single Info Section card
  const renderInfoSectionCard = (section: InfoSection, index: number) => {
    const gradientClass = colorGradients[index % colorGradients.length];
    const isOpen = openInfoSections.has(section.id);

    return (
      <Collapsible
        key={section.id}
        open={isOpen}
        onOpenChange={() => toggleInfoSection(section.id)}
      >
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className={`h-1 bg-gradient-to-r ${gradientClass}`} />
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors">
              <h3 className="text-base font-semibold text-white">{section.title}</h3>
              <ChevronDown
                className={`w-5 h-5 text-white/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 border-t border-white/5">
              {section.content ? (
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap pt-3">
                  {section.content}
                </p>
              ) : (
                <p className="text-white/50 text-sm italic pt-3">No content available</p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  // Render Info content
  const renderInfoContent = () => {
    if (infoLoading) {
      return (
        <div className="bg-white/5 rounded-xl p-6 shadow-lg shadow-black/20 text-center py-8">
          <p className="text-white/70">Loading information...</p>
        </div>
      );
    }

    if (infoError) {
      return (
        <div className="bg-white/5 rounded-xl p-6 shadow-lg shadow-black/20 text-center py-8">
          <Info className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to load information</h3>
          <p className="text-white/70">Please try refreshing the page</p>
        </div>
      );
    }

    if (!filteredInfoSections || filteredInfoSections.length === 0) {
      return (
        <div className="bg-white/5 rounded-xl p-6 shadow-lg shadow-black/20 text-center py-8">
          <Info className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm ? 'No results found' : 'No information available'}
          </h3>
          <p className="text-white/70">
            {searchTerm
              ? 'Try adjusting your search term'
              : 'Check back later for additional trip information'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredInfoSections.map((section, index) => renderInfoSectionCard(section, index))}
      </div>
    );
  };

  // Legacy fallback for hardcoded IMPORTANT_INFO (kept for backwards compatibility)
  const renderLegacyInfoContent = () => {
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
        <div className="bg-white/5 rounded-xl p-6 shadow-lg shadow-black/20 text-center py-8">
          <p className="text-white/70">Loading FAQs...</p>
        </div>
      );
    }

    if (faqsError) {
      return (
        <div className="bg-white/5 rounded-xl p-6 shadow-lg shadow-black/20 text-center py-8">
          <HelpCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to load FAQs</h3>
          <p className="text-white/70">Please try refreshing the page</p>
        </div>
      );
    }

    if (!filteredFaqs || filteredFaqs.length === 0) {
      return (
        <div className="bg-white/5 rounded-xl p-6 shadow-lg shadow-black/20 text-center py-8">
          <HelpCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm ? 'No results found' : 'No FAQs available'}
          </h3>
          <p className="text-white/70">
            {searchTerm
              ? 'Try adjusting your search term'
              : 'Check back later for frequently asked questions about this trip'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredFaqs.map(faq => (
          <Accordion key={faq.id} type="single" collapsible className="w-full">
            <AccordionItem
              value={`faq-${faq.id}`}
              className="bg-white/5 rounded-xl overflow-hidden shadow-lg shadow-black/20 border-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:bg-white/10 transition-colors [&[data-state=open]]:bg-white/5">
                <span className="text-white font-semibold text-sm pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0 border-t border-white/5">
                <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line pt-3">
                  {faq.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    );
  };

  // Render combined search results
  const renderSearchResults = () => {
    const hasInfoResults = filteredInfoSections.length > 0;
    const hasFaqResults = filteredFaqs.length > 0;

    if (!hasInfoResults && !hasFaqResults) {
      return (
        <div className="bg-white/5 rounded-xl p-6 shadow-lg shadow-black/20 text-center py-8">
          <Search className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
          <p className="text-white/70">Try adjusting your search term</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Info Results */}
        {hasInfoResults && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white/80">
                Information ({filteredInfoSections.length})
              </h4>
            </div>
            <div className="space-y-3">
              {filteredInfoSections.map((section, index) => renderInfoSectionCard(section, index))}
            </div>
          </div>
        )}

        {/* FAQ Results */}
        {hasFaqResults && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white/80">FAQs ({filteredFaqs.length})</h4>
            </div>
            <div className="space-y-4">
              {filteredFaqs.map(faq => (
                <Accordion key={faq.id} type="single" collapsible className="w-full">
                  <AccordionItem
                    value={`faq-${faq.id}`}
                    className="bg-white/5 rounded-xl overflow-hidden shadow-lg shadow-black/20 border-0"
                  >
                    <AccordionTrigger className="px-4 py-4 text-left hover:bg-white/10 transition-colors [&[data-state=open]]:bg-white/5">
                      <span className="text-white font-semibold text-sm pr-4">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 border-t border-white/5">
                      <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line pt-3">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Header with Mini Tab Bar and Search */}
      <div className="max-w-6xl mx-auto pb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Sub-tabs on the left - matching ScheduleTab style */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-full p-1 inline-flex gap-1">
            <button
              onClick={() => setSubTab('info')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subTab === 'info' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Info
            </button>
            <button
              onClick={() => setSubTab('faq')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subTab === 'faq' ? 'bg-cyan-500/30 text-white' : 'text-cyan-300 hover:text-cyan-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              FAQs
            </button>
          </div>

          {/* Search on the right */}
          <div className="relative flex-1 max-w-xs">
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-white/50" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-9 bg-white/10 border border-white/20 rounded-full text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            />
            {searchTerm && (
              <div className="absolute right-3 top-0 bottom-0 flex items-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-white/50 hover:text-white/80 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto pt-2">
        {isSearchMode
          ? renderSearchResults()
          : subTab === 'info'
            ? renderInfoContent()
            : renderFAQContent()}
      </div>
    </>
  );
});
