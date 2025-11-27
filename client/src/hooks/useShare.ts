import { Share } from '@capacitor/share';
import { isNative } from '@/lib/capacitor';

export function useShare() {
  const shareTrip = async (trip: { name: string; slug: string }) => {
    // Use current origin for local development (localhost or IP), fallback to production URL
    const siteUrl =
      window.location.origin.includes('localhost') ||
      window.location.origin.match(/\d+\.\d+\.\d+\.\d+/)
        ? window.location.origin
        : import.meta.env.VITE_SITE_URL || 'https://kgaytravelguides.com';
    const url = `${siteUrl}/trip/${trip.slug}`;

    if (isNative) {
      try {
        await Share.share({
          title: `Check out ${trip.name}!`,
          text: `Join us for an amazing LGBTQ+ travel experience`,
          url: url,
          dialogTitle: 'Share Trip',
        });
      } catch {
        // Share cancelled or failed - silent fail is expected
      }
    } else {
      // Web Share API fallback
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Check out ${trip.name}!`,
            text: `Join us for an amazing LGBTQ+ travel experience`,
            url: url,
          });
        } catch {
          // User cancelled or share failed - silent fail is expected
        }
      } else {
        // Copy to clipboard fallback
        try {
          await navigator.clipboard.writeText(url);
          alert('Link copied to clipboard!');
        } catch {
          // Clipboard access denied - silent fail
        }
      }
    }
  };

  const shareContent = async (options: {
    title: string;
    text: string;
    url: string;
    dialogTitle?: string;
  }): Promise<{ method: 'share' | 'clipboard' }> => {
    if (isNative) {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle || 'Share',
      });
      return { method: 'share' };
    } else {
      // Web Share API - only works on HTTPS or localhost
      const isSecureContext =
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (navigator.share && isSecureContext) {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        });
        return { method: 'share' };
      } else {
        // Copy to clipboard fallback
        await navigator.clipboard.writeText(options.url);
        return { method: 'clipboard' };
      }
    }
  };

  return { shareTrip, shareContent };
}
