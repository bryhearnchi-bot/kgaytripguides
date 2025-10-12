import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Instagram, Twitter, Globe, Youtube, Linkedin, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Talent } from '@/data/trip-data';
import { useTalentByCategory } from '../hooks/useTalentByCategory';

interface TalentTabProps {
  TALENT: Talent[];
  onTalentClick: (name: string) => void;
}

export const TalentTab = memo(function TalentTab({ TALENT, onTalentClick }: TalentTabProps) {
  const { talentByCategory, sortedCategories } = useTalentByCategory(TALENT);

  const handleTalentClick = useCallback(
    (name: string) => {
      onTalentClick(name);
    },
    [onTalentClick]
  );

  const getSocialIcon = useCallback((platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'linktree':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-2 -mt-2">
        <User className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
          Talent & Performers
        </h2>
      </div>

      {TALENT.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
          <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No talent information available</h3>
          <p className="text-white/70">Talent roster will be available soon.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map((category, categoryIndex) => {
            const categoryTalent = talentByCategory[category];
            if (!categoryTalent) return null;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: categoryIndex * 0.05 }}
              >
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-white/90 bg-gradient-to-r from-ocean-600 to-ocean-400 px-4 py-2 rounded-lg inline-block shadow-md">
                    {category}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryTalent.map((talent, talentIndex) => (
                    <motion.div
                      key={talent.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: categoryIndex * 0.05 + talentIndex * 0.03,
                      }}
                    >
                      <Card
                        className="p-4 bg-white/90 hover:shadow-xl transition-all duration-300 border border-gray-200 cursor-pointer group"
                        onClick={() => handleTalentClick(talent.name)}
                      >
                        <div className="flex gap-4">
                          {/* Talent Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={talent.img}
                              alt={talent.name}
                              className="w-20 h-20 rounded-full object-cover border-2 border-ocean-200 group-hover:border-ocean-400 transition-colors shadow-md"
                              loading="lazy"
                              onError={e => {
                                e.currentTarget.src =
                                  'https://via.placeholder.com/80?text=No+Image';
                              }}
                            />
                          </div>

                          {/* Talent Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-ocean-600 transition-colors">
                              {talent.name}
                            </h4>
                            <div className="mb-2">
                              <Badge
                                variant="secondary"
                                className="bg-ocean-100 text-ocean-700 text-xs"
                              >
                                {talent.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {talent.knownFor}
                            </p>

                            {/* Social Links */}
                            {talent.social && Object.keys(talent.social).length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {Object.entries(talent.social).map(([platform, url]) => {
                                  if (!url) return null;
                                  return (
                                    <a
                                      key={platform}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="text-ocean-600 hover:text-ocean-700 transition-colors"
                                      title={platform}
                                    >
                                      {getSocialIcon(platform)}
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
});
