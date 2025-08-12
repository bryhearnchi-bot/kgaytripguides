import { Switch } from "@/components/ui/switch";

interface TimeToggleProps {
  timeMode: "12h" | "24h";
  onToggle: (mode: "12h" | "24h") => void;
}

export function TimeToggle({ timeMode, onToggle }: TimeToggleProps) {
  return (
    <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-white/20">
      <span className={`text-xs font-medium transition-colors ${timeMode === "12h" ? "text-white" : "text-white/50"}`}>
        12h
      </span>
      <Switch
        checked={timeMode === "24h"}
        onCheckedChange={(checked) => onToggle(checked ? "24h" : "12h")}
        className="data-[state=checked]:bg-ocean-600 data-[state=unchecked]:bg-white/30 scale-75"
      />
      <span className={`text-xs font-medium transition-colors ${timeMode === "24h" ? "text-white" : "text-white/50"}`}>
        24h
      </span>
    </div>
  );
}
