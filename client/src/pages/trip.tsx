import { useRoute } from "wouter";
import { useEffect } from "react";
import TripGuide from "@/components/trip-guide";

export default function TripPage() {
  const [match, params] = useRoute("/trip/:slug");

  // Scroll to top when navigating to a trip page
  useEffect(() => {
    window.scrollTo(0, 0);
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