import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import TimeFormatToggle from "@/components/TimeFormatToggle";

export default function NavigationBanner() {
  return (
    <div className="bg-ocean-900 text-white py-2 px-4 shadow-lg relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <img 
              src="https://atlantisevents.com/wp-content/themes/atlantis/assets/images/logos/atlantis-logo.png" 
              alt="Atlantis Events" 
              className="h-6 w-auto brightness-0 invert hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
          <a href="https://kgaytravel.com/" target="_blank" rel="noopener noreferrer">
            <img 
              src="https://kgaytravel.com/wp-content/uploads/2019/05/k-gay-logo-blue1-hi-res.jpg" 
              alt="KGay Travel" 
              className="h-8 w-auto hover:opacity-80 transition-opacity"
            />
          </a>
        </div>
        
        <div className="flex items-center space-x-3">
          <TimeFormatToggle />
          <Link href="/admin/login">
            <Button 
              variant="outline" 
              size="sm" 
              className="!text-gray-800 !border-gray-300 !bg-white hover:!bg-gray-100 hover:!text-gray-900 transition-colors"
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}