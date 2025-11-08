import { useState } from 'react';
import { useLocation } from 'wouter';
import { AuthModal } from '@/components/auth/AuthModal';

export default function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [, navigate] = useLocation();

  const handleClose = () => {
    setIsModalOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Deep Ocean Glow Background - Same as landing page */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(70% 55% at 50% 50%, #2a5d77 0%, #184058 18%, #0f2a43 34%, #0a1b30 50%, #071226 66%, #040d1c 80%, #020814 92%, #01040d 97%, #000309 100%), radial-gradient(160% 130% at 10% 10%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%), radial-gradient(160% 130% at 90% 90%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%)',
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10">
        <AuthModal isOpen={isModalOpen} onClose={handleClose} defaultView="sign_in" />
      </div>
    </div>
  );
}
