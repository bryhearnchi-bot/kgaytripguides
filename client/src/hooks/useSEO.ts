import { useEffect } from 'react';

interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  canonical?: string;
  structuredData?: Record<string, unknown>;
}

export const useSEO = (metadata: SEOMetadata) => {
  useEffect(() => {
    // Set document title
    if (metadata.title) {
      document.title = metadata.title;
    }

    // Helper function to set or update meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }

      meta.setAttribute('content', content);
    };

    // Set basic meta tags
    if (metadata.description) {
      setMetaTag('description', metadata.description);
    }

    if (metadata.keywords && metadata.keywords.length > 0) {
      setMetaTag('keywords', metadata.keywords.join(', '));
    }

    // Set Open Graph meta tags
    if (metadata.ogTitle) {
      setMetaTag('og:title', metadata.ogTitle, true);
    }

    if (metadata.ogDescription) {
      setMetaTag('og:description', metadata.ogDescription, true);
    }

    if (metadata.ogImage) {
      setMetaTag('og:image', metadata.ogImage, true);
    }

    if (metadata.ogType) {
      setMetaTag('og:type', metadata.ogType, true);
    }

    // Set Twitter meta tags
    if (metadata.twitterCard) {
      setMetaTag('twitter:card', metadata.twitterCard);
    }

    if (metadata.ogTitle) {
      setMetaTag('twitter:title', metadata.ogTitle);
    }

    if (metadata.ogDescription) {
      setMetaTag('twitter:description', metadata.ogDescription);
    }

    if (metadata.ogImage) {
      setMetaTag('twitter:image', metadata.ogImage);
    }

    // Set canonical URL
    if (metadata.canonical) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', metadata.canonical);
    }

    // Set structured data (JSON-LD)
    if (metadata.structuredData) {
      const scriptId = 'structured-data';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }

      script.textContent = JSON.stringify(metadata.structuredData);
    }

  }, [metadata]);
};

// SEO data generators for different page types
export const generateTripSEO = (trip: {
  name: string;
  description?: string | null;
  heroImageUrl?: string | null;
  startDate: string;
  endDate: string;
  slug: string;
}): SEOMetadata => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return {
    title: `${trip.name} | Atlantis Events - LGBTQ+ Cruise Experience`,
    description: trip.description || `Join us on ${trip.name}, an unforgettable LGBTQ+ cruise experience with Atlantis Events.`,
    keywords: ['LGBTQ+ cruise', 'gay cruise', 'Atlantis Events', 'vacation', trip.name],
    ogTitle: trip.name,
    ogDescription: trip.description || `Experience ${trip.name} with Atlantis Events`,
    ogImage: trip.heroImageUrl || undefined,
    ogType: 'product',
    twitterCard: 'summary_large_image',
    canonical: `${baseUrl}/trip/${trip.slug}`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      "name": trip.name,
      "description": trip.description || `${trip.name} cruise experience`,
      "startDate": trip.startDate,
      "endDate": trip.endDate,
      "url": `${baseUrl}/trip/${trip.slug}`,
      "image": trip.heroImageUrl || undefined,
      "provider": {
        "@type": "Organization",
        "name": "Atlantis Events",
        "url": "https://atlantisevents.com"
      }
    }
  };
};

export const generateHomeSEO = (): SEOMetadata => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return {
    title: 'Atlantis Events - Premium LGBTQ+ Cruise Experiences',
    description: 'Discover unforgettable LGBTQ+ cruise experiences with Atlantis Events. Luxury accommodations, world-class entertainment, and inclusive vacation packages.',
    keywords: ['LGBTQ+ cruise', 'gay cruise', 'lesbian cruise', 'Atlantis Events', 'inclusive vacation', 'luxury cruise'],
    ogTitle: 'Atlantis Events - Premium LGBTQ+ Cruise Experiences',
    ogDescription: 'Join thousands of LGBTQ+ travelers on unforgettable cruise adventures with Atlantis Events.',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    canonical: baseUrl,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Atlantis Events",
      "description": "Premium LGBTQ+ cruise experiences and vacation packages",
      "url": baseUrl,
      "sameAs": [
        "https://www.facebook.com/AtlantisEvents",
        "https://www.instagram.com/atlantisevents",
        "https://twitter.com/atlantisevents"
      ]
    }
  };
};