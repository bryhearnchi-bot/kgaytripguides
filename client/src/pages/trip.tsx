import { useRoute } from "wouter";
import { useEffect } from "react";
import TripGuide from "@/components/trip-guide";

export default function TripPage() {
  const [match, params] = useRoute("/trip/:slug");

  // Scroll to top when navigating to a trip page
  useEffect(() => {
    // Use setTimeout to ensure DOM is ready and smooth scroll
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    };

    // Try immediate scroll first
    scrollToTop();

    // Also try after a short delay to catch any late rendering
    const timeoutId = setTimeout(scrollToTop, 100);

    return () => clearTimeout(timeoutId);
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