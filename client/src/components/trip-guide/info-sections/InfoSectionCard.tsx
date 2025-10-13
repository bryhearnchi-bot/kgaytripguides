import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Sparkles, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

export function InfoSectionCard({ section, featured = false }: InfoSectionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSectionIcon = () => {
    if (section.is_always) return <Sparkles className="h-4 w-4" />;
    if (section.section_type === 'general') return <Info className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  const getSectionBadge = () => {
    if (section.is_always) {
      return (
        <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-400/30">
          <Sparkles className="h-3 w-3 mr-1" />
          Always
        </Badge>
      );
    }
    if (section.section_type === 'general') {
      return (
        <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border-blue-400/30">
          <Info className="h-3 w-3 mr-1" />
          General
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-200 border-teal-400/30">
        <MapPin className="h-3 w-3 mr-1" />
        Trip Specific
      </Badge>
    );
  };

  const truncateContent = (text: string | null, maxLength: number = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <>
      <Card
        className={`
          group relative overflow-hidden border border-white/10
          bg-gradient-to-br from-[#0a1628]/90 via-[#0f1f3d]/90 to-[#1a2742]/90
          backdrop-blur-md hover:border-white/20 transition-all duration-300
          hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer
          ${featured ? 'h-full min-h-[280px]' : 'h-full min-h-[220px]'}
        `}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardContent className="relative p-6 flex flex-col h-full">
          {/* Header with icon and badge */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                {getSectionIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold text-white group-hover:text-cyan-300 transition-colors ${
                    featured ? 'text-xl' : 'text-lg'
                  } line-clamp-2`}
                >
                  {section.title}
                </h3>
              </div>
            </div>
            {getSectionBadge()}
          </div>

          {/* Content */}
          {section.content && (
            <p
              className={`text-white/70 leading-relaxed flex-1 ${
                featured ? 'text-base line-clamp-6' : 'text-sm line-clamp-4'
              }`}
            >
              {truncateContent(section.content, featured ? 300 : 150)}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            >
              Read more →
            </Button>
            {section.updated_by && (
              <span className="text-xs text-white/40">By {section.updated_by}</span>
            )}
          </div>
        </CardContent>

        {/* Hover glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-blue-500/0" />
        </div>
      </Card>

      {/* Modal for full content */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#1a2742] border-white/20">
          <DialogHeader>
            <div className="flex items-start gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                {getSectionIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl text-white">{section.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getSectionBadge()}
                  {section.updated_by && (
                    <span className="text-sm text-white/50">Updated by {section.updated_by}</span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="mt-4 text-white/80 text-base leading-relaxed whitespace-pre-wrap">
              {section.content || 'No content available.'}
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
