import React, { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShare } from '@/hooks/useShare';
import { isNative } from '@/lib/capacitor';
import { toast } from 'sonner';

interface ShareMenuProps {
  tripSlug: string;
  tripName: string;
  children: (props: { onClick: () => void; isOpen: boolean }) => React.ReactNode;
}

/**
 * ShareMenu - Custom share menu with dropdown positioning
 *
 * Opens downward from the trigger button with an arrow pointer
 * Positioned to the left (right-aligned with button)
 */
export function ShareMenu({ tripSlug, tripName, children }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { shareTrip } = useShare();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    // Use current origin for local development, fallback to production URL
    const siteUrl = window.location.origin.includes('localhost')
      ? window.location.origin
      : import.meta.env.VITE_SITE_URL || 'https://kgaytravelguides.com';
    const url = `${siteUrl}/trip/${tripSlug}`;

    console.log('Site URL:', siteUrl);
    console.log('Trip Slug:', tripSlug);
    console.log('Final URL:', url);

    try {
      // Try modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied!', {
          description: 'Trip link copied to clipboard',
        });
        setTimeout(() => {
          setCopied(false);
          setIsOpen(false);
        }, 1500);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          toast({
            title: 'Link copied!',
            description: 'Trip link copied to clipboard',
          });
          setTimeout(() => {
            setCopied(false);
            setIsOpen(false);
          }, 1500);
        } catch (err) {
          console.error('Fallback copy failed:', err);
          toast({
            title: 'Failed to copy',
            description: 'Please try again or copy the URL manually',
            variant: 'destructive',
          });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: 'Failed to copy',
        description: 'Please try again or copy the URL manually',
        variant: 'destructive',
      });
    }
  };

  const handleNativeShare = async () => {
    await shareTrip({ name: tripName, slug: tripSlug });
    setIsOpen(false);
  };

  const hasNativeShare = isNative || (typeof navigator !== 'undefined' && navigator.share);

  return (
    <div ref={menuRef} className="relative">
      {children({
        onClick: () => setIsOpen(!isOpen),
        isOpen,
      })}

      {isOpen && (
        <div
          className={cn(
            'absolute top-full right-0 mt-2',
            'w-48 rounded-lg',
            'bg-[#002147] border border-white/20',
            'shadow-xl',
            'animate-in fade-in slide-in-from-top-2 duration-200',
            'z-[10001]'
          )}
        >
          {/* Arrow pointer */}
          <div className="absolute -top-2 right-3 w-4 h-4 bg-[#002147] border-l border-t border-white/20 rotate-45" />

          {/* Menu items */}
          <div className="relative py-2">
            <button
              onClick={handleCopyLink}
              className={cn(
                'w-full px-4 py-2.5 flex items-center gap-3',
                'text-white hover:bg-white/10 transition-colors',
                'text-sm font-medium'
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {hasNativeShare && (
              <button
                onClick={handleNativeShare}
                className={cn(
                  'w-full px-4 py-2.5 flex items-center gap-3',
                  'text-white hover:bg-white/10 transition-colors',
                  'text-sm font-medium'
                )}
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
