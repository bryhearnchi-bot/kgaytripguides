import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Info, Utensils, Music, Lightbulb, Ship, Clock, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IMPORTANT_INFO } from '@/data/trip-data';

interface InfoTabProps {
  IMPORTANT_INFO: typeof IMPORTANT_INFO;
}

export const InfoTab = memo(function InfoTab({ IMPORTANT_INFO }: InfoTabProps) {
  // Early return if no data
  if (!IMPORTANT_INFO || Object.keys(IMPORTANT_INFO).length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center space-x-2 mb-2 -mt-2">
          <Info className="w-5 h-5 text-white/80" />
          <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
            Important Information
          </h2>
        </div>
        <div className="bg-white/85 backdrop-blur-sm rounded-md p-6 shadow-sm text-center py-8 border border-white/30">
          <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No information available</h3>
          <p className="text-gray-500">No important information about this trip.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center space-x-2 mb-2 -mt-2">
        <Info className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
          Important Information
        </h2>
      </div>

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
                    <p className="text-sm text-gray-600">{IMPORTANT_INFO.entertainment.walkIns}</p>
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
                    <p className="text-sm font-semibold text-gray-900">All Restaurants Included</p>
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
});
