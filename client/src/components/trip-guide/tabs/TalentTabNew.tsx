import React, { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Sparkles,
  Mic2,
  Music,
  Laugh,
  Disc3,
  Piano,
  Drama,
  Users,
  Crown,
} from 'lucide-react';
import type { Talent } from '@/data/trip-data';
import { TalentCard } from '../shared/TalentCard';

interface TalentTabProps {
  TALENT: Talent[];
  SCHEDULED_DAILY: Array<{
    key: string;
    items: Array<{
      time: string;
      title: string;
      venue: string;
      talent?: Array<{ name: string }>;
      date?: string;
    }>;
  }>;
  onTalentClick: (name: string) => void;
}

// Define headliners - these will appear in a special section
const HEADLINERS = ['Audra McDonald'];

export const TalentTabNew = memo(function TalentTabNew({
  TALENT,
  SCHEDULED_DAILY,
  onTalentClick,
}: TalentTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Separate headliners and other talent
  const { headliners, otherTalent } = useMemo(() => {
    const heads: Talent[] = [];
    const others: Talent[] = [];

    TALENT.forEach(talent => {
      if (HEADLINERS.includes(talent.name)) {
        heads.push(talent);
      } else {
        others.push(talent);
      }
    });

    // Sort others alphabetically
    others.sort((a, b) => a.name.localeCompare(b.name));

    return { headliners: heads, otherTalent: others };
  }, [TALENT]);

  // Icon mapping for talent types
  const getTalentIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      All: Users,
      Headliners: Sparkles,
      'Drag & Variety': Crown,
      Vocalists: Mic2,
      Comedy: Laugh,
      "DJ's": Disc3,
      'Piano Bar / Cabaret': Piano,
      Shows: Drama,
    };
    return iconMap[type] || User;
  };

  // Get all unique talent types/categories (excluding headliners' categories)
  const talentTypes = useMemo(() => {
    const types = new Set<string>();
    otherTalent.forEach(talent => {
      if (talent.cat) {
        types.add(talent.cat);
      }
    });
    return ['All', ...Array.from(types).sort()];
  }, [otherTalent]);

  // Filter talent by selected type
  const filteredTalent = useMemo(() => {
    if (selectedFilter === 'All') {
      return otherTalent;
    }
    return otherTalent.filter(talent => talent.cat === selectedFilter);
  }, [otherTalent, selectedFilter]);

  const handleTalentClick = (talentName: string) => {
    onTalentClick(talentName);
  };

  if (TALENT.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
          <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No talent information available</h3>
          <p className="text-white/70">Talent roster will be available soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      {/* Headliners Section */}
      {headliners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent">
              Headliners
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {headliners.map((talent, index) => (
              <TalentCard
                key={talent.name}
                talent={talent}
                onClick={() => handleTalentClick(talent.name)}
                delay={index * 0.1}
                categoryIcon={getTalentIcon(talent.cat)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* All Talent Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: headliners.length > 0 ? 0.2 : 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between mb-3">
          {/* Header - Hidden on mobile, shown on desktop */}
          <div className="hidden sm:flex items-center space-x-2">
            {(() => {
              const Icon = getTalentIcon(selectedFilter);
              return <Icon className="w-5 h-5 text-white/80" />;
            })()}
            <h2 className="text-xl font-bold text-white/90 tracking-wide uppercase">
              {selectedFilter === 'All' ? 'All Talent' : selectedFilter}
            </h2>
          </div>

          {/* Filter Bar - Left-aligned on mobile, right-aligned on desktop */}
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {talentTypes.map(type => {
              const isActive = selectedFilter === type;
              const Icon = getTalentIcon(type);
              return (
                <button
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors border flex items-center gap-1 ${
                    isActive
                      ? 'bg-purple-400/50 text-white border-purple-300/60 font-bold shadow-lg'
                      : 'bg-purple-500/20 text-purple-200 border-purple-400/30 hover:bg-purple-500/30 font-medium'
                  }`}
                  aria-label={type}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{type}</span>
                  {isActive && (
                    <span className="sm:hidden">
                      {type === 'Piano Bar / Cabaret'
                        ? 'Cabaret'
                        : type === 'Drag & Variety'
                          ? 'Drag'
                          : type}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Talent Grid */}
        {filteredTalent.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 text-center border border-white/20">
            <User className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <p className="text-white/60">No talent found for this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTalent.map((talent, index) => (
              <TalentCard
                key={talent.name}
                talent={talent}
                onClick={() => handleTalentClick(talent.name)}
                delay={index * 0.05}
                categoryIcon={getTalentIcon(talent.cat)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
});
