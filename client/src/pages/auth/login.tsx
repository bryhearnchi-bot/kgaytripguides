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
    <div className="min-h-screen w-full bg-[#002147] relative">
      {/* 30% black overlay for darkening effect */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />
      {/* Content Layer */}
      <div className="relative z-10">
        <AuthModal isOpen={isModalOpen} onClose={handleClose} defaultView="sign_in" />
      </div>
    </div>
  );
}
