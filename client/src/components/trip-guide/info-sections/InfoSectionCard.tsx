import React, { memo, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface InfoSectionCardProps {
  section: InfoSection;
  colorIndex?: number;
}

// Color gradient options for the top bar
const colorGradients = [
  'from-cyan-400 to-blue-500',
  'from-orange-400 to-red-500',
  'from-green-400 to-emerald-500',
  'from-purple-400 to-pink-500',
  'from-yellow-400 to-orange-500',
  'from-teal-400 to-cyan-500',
];

export const InfoSectionCard = memo<InfoSectionCardProps>(function InfoSectionCard({
  section,
  colorIndex = 0,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const gradientClass = useMemo(() => {
    return colorGradients[colorIndex % colorGradients.length];
  }, [colorIndex]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {/* Top Color Bar */}
        <div className={`h-1 bg-gradient-to-r ${gradientClass}`} />

        {/* Collapsible Trigger */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors">
            <h3 className="text-base font-semibold text-white">{section.title}</h3>
            <ChevronDown
              className={`w-5 h-5 text-white/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </CollapsibleTrigger>

        {/* Collapsible Content */}
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
});
