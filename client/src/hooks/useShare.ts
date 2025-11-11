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

    console.log('Share - Site URL:', siteUrl);
    console.log('Share - Trip slug:', trip.slug);
    console.log('Share - Full URL:', url);

    if (isNative) {
      try {
        await Share.share({
          title: `Check out ${trip.name}!`,
          text: `Join us for an amazing LGBTQ+ travel experience`,
          url: url,
          dialogTitle: 'Share Trip',
        });
      } catch (error) {
        console.error('Share failed:', error);
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
        } catch (error) {
          // User cancelled or share failed
          console.error('Web share failed:', error);
        }
      } else {
        // Copy to clipboard fallback
        try {
          await navigator.clipboard.writeText(url);
          alert('Link copied to clipboard!');
        } catch (error) {
          console.error('Clipboard copy failed:', error);
        }
      }
    }
  };

  const shareContent = async (options: {
    title: string;
    text: string;
    url: string;
    dialogTitle?: string;
  }) => {
    if (isNative) {
      try {
        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: options.dialogTitle || 'Share',
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Web Share API fallback
      if (navigator.share) {
        try {
          await navigator.share({
            title: options.title,
            text: options.text,
            url: options.url,
          });
        } catch (error) {
          console.error('Web share failed:', error);
        }
      } else {
        // Copy to clipboard fallback
        try {
          await navigator.clipboard.writeText(options.url);
          alert('Link copied to clipboard!');
        } catch (error) {
          console.error('Clipboard copy failed:', error);
        }
      }
    }
  };

  return { shareTrip, shareContent };
}
