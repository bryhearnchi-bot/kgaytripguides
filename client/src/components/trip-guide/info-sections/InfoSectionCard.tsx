import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Sparkles, MapPin } from 'lucide-react';

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
  featured?: boolean;
}

// Move helper function outside component to avoid recreation
const truncateContent = (text: string | null, maxLength: number = 150) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const InfoSectionCard = memo<InfoSectionCardProps>(function InfoSectionCard({
  section,
  featured = false,
}) {
  const sectionIcon = useMemo(() => {
    if (section.is_always) return <Sparkles className="h-5 w-5 text-white" />;
    if (section.section_type === 'general') return <Info className="h-5 w-5 text-white" />;
    return <MapPin className="h-5 w-5 text-white" />;
  }, [section.is_always, section.section_type]);

  return (
    <Card className="group relative overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl transition-all duration-300">
      {/* Header Bar with Ocean Gradient */}
      <div className="bg-gradient-to-r from-ocean-600/80 to-ocean-400/80 backdrop-blur-sm p-3.5 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">{sectionIcon}</div>
          <h3 className="text-lg font-bold text-white tracking-wide">{section.title}</h3>
        </div>
      </div>

      {/* Content Area with Frosted Glass Effect */}
      <CardContent className="p-4 bg-gradient-to-br from-slate-900/20 via-slate-800/20 to-slate-900/20 backdrop-blur-sm">
        {section.content ? (
          <div
            className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        ) : (
          <p className="text-white/50 text-sm italic">No content available</p>
        )}
      </CardContent>
    </Card>
  );
});
