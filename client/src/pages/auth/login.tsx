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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <AuthModal
        isOpen={isModalOpen}
        onClose={handleClose}
        defaultView="sign_in"
      />
    </div>
  );
}