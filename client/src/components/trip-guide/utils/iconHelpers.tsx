import React from "react";
import {
  Flag,
  Globe,
  Crown,
  Star,
  Anchor,
  Zap,
  Heart,
  Sparkles,
  Disc,
  Music2,
  Palette,
  Music,
  PartyPopper
} from "lucide-react";

export function getPartyIcon(title: string): React.ReactElement {
  if (title.includes("Dog Tag")) return <Flag className="w-4 h-4" />;
  if (title.includes("UNITE")) return <Globe className="w-4 h-4" />;
  if (title.includes("Empires")) return <Crown className="w-4 h-4" />;
  if (title.includes("Greek Isles") || title.includes("Here We Go Again")) return <Star className="w-4 h-4" />;
  if (title.includes("Lost At Sea")) return <Anchor className="w-4 h-4" />;
  if (title.includes("Neon")) return <Zap className="w-4 h-4" />;
  if (title.includes("Think Pink")) return <Heart className="w-4 h-4" />;
  if (title.includes("Virgin White") || title.includes("White")) return <Sparkles className="w-4 h-4" />;
  if (title.includes("Revival") || title.includes("Disco")) return <Disc className="w-4 h-4" />;
  if (title.includes("Atlantis Classics")) return <Music2 className="w-4 h-4" />;
  if (title.includes("Off-White")) return <Palette className="w-4 h-4" />;
  if (title.includes("Last Dance")) return <Music className="w-4 h-4" />;
  if (title.includes("Welcome") || title.includes("Sail-Away")) return <PartyPopper className="w-4 h-4" />;
  if (title.toLowerCase().includes("bingo")) return <img src="https://img.freepik.com/premium-vector/bingo-pop-art-cartoon-comic-background-design-template_393879-5344.jpg" alt="Bingo" className="w-4 h-4 rounded object-cover" />;
  return <PartyPopper className="w-4 h-4" />;
}