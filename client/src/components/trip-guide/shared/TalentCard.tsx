import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';
import type { Talent } from '@/data/trip-data';

interface TalentCardProps {
  talent: Talent;
  onClick: () => void;
  delay?: number;
  categoryIcon?: LucideIcon;
}

export const TalentCard = memo<TalentCardProps>(function TalentCard({
  talent,
  onClick,
  delay = 0,
  categoryIcon: CategoryIcon,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-white/30"
    >
      <div className="flex flex-row h-full">
        {/* Left: Artist Image */}
        <div className="relative w-32 sm:w-40 md:w-48 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
          <img
            src={talent.img}
            alt={talent.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              e.currentTarget.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
        </div>

        {/* Right: Content */}
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col justify-between min-w-0">
          <div className="flex-1 min-w-0">
            {/* Artist Name */}
            <h3 className="text-white font-bold text-base sm:text-lg mb-1.5 sm:mb-2 group-hover:text-ocean-200 transition-colors truncate">
              {talent.name}
            </h3>

            {/* Talent Type Badge */}
            <div className="mb-2 sm:mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-xs font-medium border border-purple-400/30">
                {CategoryIcon && <CategoryIcon className="w-3 h-3" />}
                {talent.cat}
              </span>
            </div>

            {/* Known For */}
            <p className="text-ocean-100 text-xs sm:text-sm line-clamp-2 mb-2">{talent.knownFor}</p>
          </div>

          {/* More Info Button */}
          <div className="flex items-center justify-end mt-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 rounded-md border border-cyan-400/30 transition-all duration-200 text-xs font-medium group/btn">
              <span>More Info</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
