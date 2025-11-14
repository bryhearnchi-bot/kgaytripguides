import { useLocation } from 'wouter';

export default function BottomSafeArea() {
  const [location] = useLocation();
  const isLandingPage = location === '/';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)] pointer-events-none ${
        isLandingPage ? 'bg-transparent' : 'bg-[#002147]'
      }`}
    />
  );
}
