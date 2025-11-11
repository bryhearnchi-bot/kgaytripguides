import { Share } from '@capacitor/share';
import { isNative } from '@/lib/capacitor';

export function useShare() {
  const shareTrip = async (trip: { name: string; slug: string }) => {
    // Use environment variable for site URL, fallback to production domain
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://kgaytravelguides.com';
    const url = `${siteUrl}/trip/${trip.slug}`;

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
