import { Link2, FileUp, Edit3 } from 'lucide-react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { cn } from '@/lib/utils';

export function BuildMethodPage() {
  const { setBuildMethod, setCurrentPage } = useTripWizard();

  const handleMethodSelect = (method: 'url' | 'pdf' | 'manual') => {
    setBuildMethod(method);
    setCurrentPage(1); // Move to BasicInfoPage
  };

  const methods = [
    {
      id: 'url' as const,
      title: 'Import from URL',
      description:
        "Provide a URL to the charter company's trip page and let AI extract the data automatically",
      icon: Link2,
      badge: 'AI Powered',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30',
    },
    {
      id: 'pdf' as const,
      title: 'Upload PDF',
      description:
        'Upload a PDF file with trip information and let AI extract the data automatically',
      icon: FileUp,
      badge: 'AI Powered',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30',
    },
    {
      id: 'manual' as const,
      title: 'Build Manually',
      description: 'Fill in all trip information manually without AI assistance',
      icon: Edit3,
      badge: 'Manual Entry',
      badgeColor: 'bg-white/10 text-white/60 border-white/20',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {methods.map(method => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={cn(
                'group relative p-4 rounded-xl border-2 transition-all duration-200',
                'bg-white/[0.02] border-white/10',
                'hover:bg-white/[0.04] hover:border-cyan-400/40',
                'focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                'text-left'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                    'bg-white/5 border border-white/10',
                    'group-hover:bg-cyan-400/10 group-hover:border-cyan-400/30',
                    'transition-all duration-200'
                  )}
                >
                  <Icon className="w-5 h-5 text-white/70 group-hover:text-cyan-400 transition-colors" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {method.title}
                    </h3>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                        method.badgeColor
                      )}
                    >
                      {method.badge}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{method.description}</p>
                </div>

                {/* Arrow indicator */}
                <div className="flex-shrink-0 text-white/30 group-hover:text-cyan-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[11px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">AI Tip:</span> For fastest results, use
          Import from URL when the charter company has a dedicated trip page. AI will automatically
          extract trip details, itinerary, images, and more.
        </p>
      </div>
    </div>
  );
}
