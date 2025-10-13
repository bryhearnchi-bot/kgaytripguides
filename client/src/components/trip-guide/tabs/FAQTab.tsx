import React, { memo } from 'react';
import { HelpCircle } from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center space-x-2 mb-2 -mt-2">
          <HelpCircle className="w-5 h-5 text-white/80" />
          <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
          <p className="text-white/70">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center space-x-2 mb-2 -mt-2">
          <HelpCircle className="w-5 h-5 text-white/80" />
          <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
            Frequently Asked Questions
          </h2>
        </div>
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
        <div className="flex items-center space-x-2 mb-2 -mt-2">
          <HelpCircle className="w-5 h-5 text-white/80" />
          <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
            Frequently Asked Questions
          </h2>
        </div>
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
      <div className="flex items-center space-x-2 mb-2 -mt-2">
        <HelpCircle className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-md border border-white/20 overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.id}
              value={`faq-${faq.id}`}
              className={`border-b border-white/10 ${index === faqs.length - 1 ? 'border-b-0' : ''}`}
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
    </div>
  );
});
