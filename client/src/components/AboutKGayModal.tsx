import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ExternalLink, Ship, Heart, MapPin, Phone, Mail, X } from 'lucide-react';

interface AboutKGayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutKGayModal({ open, onOpenChange }: AboutKGayModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-3xl border-white/20 text-white overflow-hidden [&>button]:hidden"
        style={{
          borderRadius: 16,
          background:
            'linear-gradient(to bottom right, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Custom Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-[60] w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="flex flex-col sm:flex-row w-full max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)] overflow-y-auto">
          {/* Left Side - Image (hidden on mobile phones, visible on tablets+) */}
          <div className="hidden sm:block sm:w-52 flex-shrink-0">
            <img
              src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/general/general-4b65d902-7cf2-4745-82cf-9f695966cd3c.jpg"
              alt="KGAY Travel"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 p-4 sm:p-6 space-y-4">
            {/* Header */}
            <div>
              <div className="text-ocean-200 text-sm font-medium mb-0.5">About</div>
              <h2 className="text-white text-lg font-bold">KGAY Travel</h2>
              <p className="text-ocean-100 text-sm">
                Your trusted partner in LGBTQ+ travel experiences
              </p>
            </div>

            {/* Mission Badge */}
            <div className="flex flex-row gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 backdrop-blur-sm border border-pink-300/30 text-pink-100 text-xs font-semibold shadow-md">
                WE NEVER CHARGE YOU FOR OUR SERVICE!
              </span>
            </div>

            {/* Description */}
            <p className="text-ocean-50 text-sm leading-relaxed">
              KGAY Travel specializes in curating exceptional travel experiences for the LGBTQ+
              community. This fee-free approach allows us to provide professional travel planning
              without adding costs to our clients.
            </p>

            {/* Services Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Ship className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ocean-300" />
                <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide">
                  Services
                </h3>
              </div>
              <ul className="space-y-1.5 text-white/90 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-ocean-300 text-lg leading-none">•</span>
                  <span>Gay cruises, river cruises, and world expeditions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ocean-300 text-lg leading-none">•</span>
                  <span>Resort vacations and adventure trips</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ocean-300 text-lg leading-none">•</span>
                  <span>Pride events in Tel Aviv, Amsterdam, Rio de Janeiro</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ocean-300 text-lg leading-none">•</span>
                  <span>Event promotion with discounted hotel rates</span>
                </li>
              </ul>
            </div>

            {/* Leadership Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide">
                  Leadership
                </h3>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                <span className="font-semibold text-white">Steven Krumholz</span> (Steven K)
                operates as the principal travel specialist, bringing expertise and passion for
                LGBTQ+ travel with personalized service and extensive destination knowledge.
              </p>
            </div>

            {/* Contact Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide">
                  Contact
                </h3>
              </div>
              <ul className="space-y-1.5 text-white/90 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-ocean-300" />
                  <a href="tel:310.560.9887" className="hover:text-white transition-colors">
                    310.560.9887
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-ocean-300" />
                  <a
                    href="mailto:steven@kgaytravel.com"
                    className="hover:text-white transition-colors"
                  >
                    steven@kgaytravel.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Bottom Action Button */}
            <button
              onClick={() => window.open('https://kgaytravel.com', '_blank')}
              className="w-full mt-4 px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-400/30 backdrop-blur-md border border-white/10 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Visit KGAY Travel Website
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
