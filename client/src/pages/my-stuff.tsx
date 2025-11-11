import { Star } from 'lucide-react';

export default function MyStuff() {
  return (
    <div className="min-h-screen text-white pt-16 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">My Stuff</h3>
            <div className="flex-1 h-px bg-white/20 ml-3"></div>
          </div>
        </div>

        <div className="text-center py-16">
          <Star className="w-20 h-20 mx-auto mb-6 text-white/40" />
          <p className="text-lg text-white/80 mb-2">Coming Soon</p>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            Save your favorite trips, events, and more! This feature will let you bookmark and
            organize all your favorite content in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
