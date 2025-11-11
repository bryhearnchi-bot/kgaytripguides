import { Star } from 'lucide-react';

export default function MyStuff() {
  return (
    <div className="min-h-screen text-white pt-16 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mt-12 text-center py-16">
          <Star className="w-20 h-20 mx-auto mb-6 text-white/40" />
          <h1 className="text-3xl font-bold text-white mb-4">My Stuff</h1>
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
