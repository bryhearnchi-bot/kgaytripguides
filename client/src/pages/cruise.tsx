import { useRoute } from "wouter";
import CruiseGuide from "@/components/cruise-guide";

export default function CruisePage() {
  const [match, params] = useRoute("/cruise/:slug");
  
  if (!match || !params?.slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Invalid cruise URL</p>
      </div>
    );
  }

  return <CruiseGuide slug={params.slug} />;
}