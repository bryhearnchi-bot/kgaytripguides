import React, { memo, useState, useMemo } from 'react';
import { HelpCircle, Search, X } from 'lucide-react';
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

interface FAQTabProps {
  tripId: number;
}

export const FAQTab = memo(function FAQTab({ tripId }: FAQTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: faqs,
    isLoading,
    error,
  } = useQuery<FAQ[]>({
    queryKey: ['trip-faqs', tripId],
    queryFn: async () => {
      const response = await api.get(`/api/faqs/trip/${tripId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
          <p className="text-white/70">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
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
      <div className="max-w-6xl mx-auto space-y-4">
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
    <div className="max-w-6xl mx-auto space-y-4">
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
});
