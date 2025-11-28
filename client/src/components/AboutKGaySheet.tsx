import React from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ExternalLink, Ship, Heart, MapPin, Phone, Mail, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AboutKGaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutKGaySheet({ open, onOpenChange }: AboutKGaySheetProps) {
  const isMobile = useIsMobile();

  // Mobile: Full page slide up, Tablet/Desktop: Left side panel
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="bg-[#002147] border-t border-white/20 rounded-t-2xl p-0 h-[100dvh] flex flex-col [&>button]:hidden"
        >
          <SheetTitle className="sr-only">About KGay Travel</SheetTitle>
          <SheetDescription className="sr-only">
            Information about KGay Travel services and contact details
          </SheetDescription>

          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="/logos/kgay-logo.jpg"
                alt="KGay Travel"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div>
                <h2 className="text-white text-lg font-bold">KGay Travel</h2>
                <p className="text-white/60 text-xs">Your LGBTQ+ travel partner</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <AboutContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Tablet/Desktop: Left side panel
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="bg-[#002147] border-r border-white/20 p-0 w-[400px] sm:w-[450px] flex flex-col [&>button]:hidden"
      >
        <SheetTitle className="sr-only">About KGay Travel</SheetTitle>
        <SheetDescription className="sr-only">
          Information about KGay Travel services and contact details
        </SheetDescription>

        {/* Header with close button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/logos/kgay-logo.jpg"
              alt="KGay Travel"
              className="h-10 w-10 rounded-lg object-cover"
            />
            <div>
              <h2 className="text-white text-lg font-bold">KGay Travel</h2>
              <p className="text-white/60 text-xs">Your LGBTQ+ travel partner</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AboutContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AboutContent() {
  return (
    <div className="space-y-5">
      {/* Mission Badge */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-400/30 text-pink-200 text-xs font-semibold">
          WE NEVER CHARGE YOU FOR OUR SERVICE!
        </span>
      </div>

      {/* Description */}
      <p className="text-white/80 text-sm leading-relaxed">
        KGay Travel specializes in curating exceptional travel experiences for the LGBTQ+ community.
        This fee-free approach allows us to provide professional travel planning without adding
        costs to our clients.
      </p>

      {/* Services Section */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-cyan-500/20 p-1.5 rounded">
            <Ship className="w-4 h-4 text-cyan-300" />
          </div>
          <h3 className="text-white font-semibold text-sm">Services</h3>
        </div>
        <ul className="space-y-2 text-white/80 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5">•</span>
            <span>Gay cruises, river cruises, and world expeditions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5">•</span>
            <span>Resort vacations and adventure trips</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5">•</span>
            <span>Pride events in Tel Aviv, Amsterdam, Rio de Janeiro</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5">•</span>
            <span>Event promotion with discounted hotel rates</span>
          </li>
        </ul>
      </div>

      {/* Leadership Section */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-pink-500/20 p-1.5 rounded">
            <Heart className="w-4 h-4 text-pink-300" />
          </div>
          <h3 className="text-white font-semibold text-sm">Leadership</h3>
        </div>
        <p className="text-white/80 text-sm leading-relaxed">
          <span className="font-semibold text-white">Steven Krumholz</span> (Steven K) operates as
          the principal travel specialist, bringing expertise and passion for LGBTQ+ travel with
          personalized service and extensive destination knowledge.
        </p>
      </div>

      {/* Contact Section */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-orange-500/20 p-1.5 rounded">
            <MapPin className="w-4 h-4 text-orange-300" />
          </div>
          <h3 className="text-white font-semibold text-sm">Contact</h3>
        </div>
        <ul className="space-y-2 text-white/80 text-sm">
          <li>
            <a
              href="tel:310.560.9887"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>310.560.9887</span>
            </a>
          </li>
          <li>
            <a
              href="mailto:steven@kgaytravel.com"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>steven@kgaytravel.com</span>
            </a>
          </li>
        </ul>
      </div>

      {/* Bottom Action Button */}
      <button
        onClick={() => window.open('https://kgaytravel.com', '_blank')}
        className="w-full px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
      >
        Visit KGay Travel Website
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}
