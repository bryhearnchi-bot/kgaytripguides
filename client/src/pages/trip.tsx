import { useRoute } from "wouter";
import { useEffect } from "react";
import TripGuide from "@/components/trip-guide";

export default function TripPage() {
  const [match, params] = useRoute("/trip/:slug");

  // Robust scroll to top implementation
  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    const forceScrollToTop = () => {
      // Multiple scroll methods for maximum compatibility
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Also try with options
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    };

    // Immediate scroll
    forceScrollToTop();

    // Use requestAnimationFrame for next paint cycle
    requestAnimationFrame(() => {
      forceScrollToTop();

      // Additional attempts with longer delays
      setTimeout(forceScrollToTop, 1);
      setTimeout(forceScrollToTop, 10);
      setTimeout(forceScrollToTop, 50);
      setTimeout(forceScrollToTop, 100);
      setTimeout(forceScrollToTop, 200);
    });

  }, [params?.slug]);
  
  if (!match || !params?.slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Invalid trip URL</p>
      </div>
    );
  }

  return <TripGuide slug={params.slug} />;
}