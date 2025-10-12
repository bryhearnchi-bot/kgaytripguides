import { useEffect, useRef, useState, type JSX } from 'react';
import type { SVGProps } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useOnClickOutside } from 'usehooks-ts';
import { Circle } from 'lucide-react';

export interface Job {
  company: string;
  title: string;
  logo: React.ReactNode;
  job_description: string;
  salary: string;
  location: string;
  remote: string;
  job_time: string;
  dayNumber?: number;
}

export interface JobListingComponentProps {
  jobs: Job[];
  className?: string;
  onJobClick?: (job: Job) => void;
}

export const Resend = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 600 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M186 447.471V154H318.062C336.788 154 353.697 158.053 368.79 166.158C384.163 174.263 396.181 185.443 404.845 199.698C413.51 213.672 417.842 229.604 417.842 247.491C417.842 265.938 413.51 282.568 404.845 297.381C396.181 311.915 384.302 323.375 369.209 331.759C354.117 340.144 337.067 344.337 318.062 344.337H253.917V447.471H186ZM348.667 447.471L274.041 314.99L346.99 304.509L430 447.471H348.667ZM253.917 289.835H311.773C319.04 289.835 325.329 288.298 330.639 285.223C336.229 281.869 340.421 277.258 343.216 271.388C346.291 265.519 347.828 258.811 347.828 251.265C347.828 243.718 346.151 237.15 342.797 231.56C339.443 225.691 334.552 221.219 328.124 218.144C321.975 215.07 314.428 213.533 305.484 213.533H253.917V289.835Z"
      fill="inherit"
    />
  </svg>
);

export const Turso = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="1em"
    viewBox="0 0 201 170"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m100.055 170c-2.1901 0-18.2001-12.8-21.3001-16.45-2.44 3.73-6.44 7.96-6.44 7.96-11.05-5.57-25.17-20.06-27.83-25.13-2.62-5-12.13-62.58-12.39-79.3-.34-9.41 5.85-28.49 67.9601-28.49 62.11 0 68.29 19.08 67.96 28.49-.25 16.72-9.76 74.3-12.39 79.3-2.66 5.07-16.78 19.56-27.83 25.13 0 0-4-4.23-6.44-7.96-3.1 3.65-19.11 16.45-21.3 16.45z"
      fill="#1ebca1"
    />
    <path
      d="m100.055 132.92c-20.7301 0-33.9601-10.95-33.9601-10.95l1.91-26.67-21.75-1.94-3.91-31.55h115.4301l-3.91 31.55-21.75 1.94 1.91 26.67s-13.23 10.95-33.96 10.95z"
      fill="#183134"
    />
    <path
      d="m121.535 75.79 78.52-27.18c-4.67-27.94-29.16-48.61-29.16-48.61v30.78l-14.54 3.75-9.11-10.97-7.8 15.34-39.38 10.16-39.3801-10.16-7.8-15.34-9.11 10.97-14.54-3.75v-30.78s-24.50997 20.67-29.1799684 48.61l78.5199684 27.18-2.8 37.39c6.7 1.7 13.75 3.39 24.2801 3.39 10.53 0 17.57-1.69 24.27-3.39l-2.8-37.39z"
      fill="#4ff8d2"
    />
  </svg>
);

export const Supabase = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 109 113"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
      fill="url(#paint0_linear)"
    />
    <path
      d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
      fill="url(#paint1_linear)"
      fillOpacity={0.2}
    />
    <path
      d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
      fill="#3ECF8E"
    />
    <defs>
      <linearGradient
        id="paint0_linear"
        x1={53.9738}
        y1={54.974}
        x2={94.1635}
        y2={71.8295}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#249361" />
        <stop offset={1} stopColor="#3ECF8E" />
      </linearGradient>
      <linearGradient
        id="paint1_linear"
        x1={36.1558}
        y1={30.578}
        x2={54.4844}
        y2={65.0806}
        gradientUnits="userSpaceOnUse"
      >
        <stop />
        <stop offset={1} stopOpacity={0} />
      </linearGradient>
    </defs>
  </svg>
);

export default function JobListingComponent({
  jobs,
  className,
  onJobClick,
}: JobListingComponentProps) {
  const [activeItem, setActiveItem] = useState<Job | null>(null);
  const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  useOnClickOutside(ref, () => setActiveItem(null));

  // Format day number with Pre-Cruise/Post-Cruise labels
  const formatDayLabel = (dayNumber?: number): string => {
    if (dayNumber === undefined) return '';
    if (dayNumber < 0) return 'Pre-Cruise';
    if (dayNumber >= 100) return 'Post-Cruise';
    return `Day ${dayNumber}`;
  };

  useEffect(() => {
    function onKeyDown(event: { key: string }) {
      if (event.key === 'Escape') {
        setActiveItem(null);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {activeItem && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto">
            <motion.div
              className="bg-white/95 backdrop-blur-lg flex h-fit w-[90%] max-w-2xl flex-col items-start gap-4 overflow-hidden border border-white/30 p-6 shadow-2xl my-8"
              ref={ref}
              layoutId={`workItem-${activeItem.job_time}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ borderRadius: 12 }}
            >
              <div className="flex w-full items-center gap-4">
                <motion.div layoutId={`workItemLogo-${activeItem.job_time}`}>
                  {activeItem.logo}
                </motion.div>
                <div className="flex grow items-center justify-between">
                  <div className="flex w-full flex-col gap-0.5">
                    {/* Day Number and Date Row */}
                    <motion.div
                      className="text-gray-500 text-sm font-medium flex items-center gap-2"
                      layoutId={`workItemDayDate-${activeItem.job_time}`}
                    >
                      <span>{formatDayLabel(activeItem.dayNumber)}</span>
                      {activeItem.dayNumber !== undefined && (
                        <>
                          <Circle className="w-1.5 h-1.5 fill-current" />
                          <span>{activeItem.title}</span>
                        </>
                      )}
                    </motion.div>

                    <motion.div
                      className="text-gray-900 text-lg font-bold"
                      layoutId={`workItemCompany-${activeItem.job_time}`}
                    >
                      {activeItem.company}
                    </motion.div>
                    <motion.p
                      layoutId={`workItemTitle-${activeItem.job_time}`}
                      className="text-gray-600 text-sm"
                    >
                      {activeItem.salary}
                    </motion.p>
                    {/* All Aboard Time - Frosted Pink/Red Badge */}
                    {activeItem.remote && (
                      <motion.div
                        className="flex flex-row gap-2 text-xs mt-2"
                        layoutId={`workItemExtras-${activeItem.job_time}`}
                      >
                        <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 backdrop-blur-sm border border-pink-300/50 text-pink-700 text-xs font-semibold shadow-md">
                          All Aboard: {activeItem.remote}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="text-gray-700 text-sm leading-relaxed"
              >
                {activeItem.job_description}
              </motion.p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className={`relative flex items-start ${className || ''}`}>
        <div className="relative flex w-full flex-col items-center gap-4">
          {jobs.map(role => (
            <motion.div
              layoutId={
                activeItem?.job_time === role.job_time ? undefined : `workItem-${role.job_time}`
              }
              key={role.job_time}
              className="group bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] flex w-full cursor-pointer flex-row items-center gap-4 py-3 pl-3 pr-5 min-h-[140px]"
              onClick={() => {
                setActiveItem(role);
                if (onJobClick) onJobClick(role);
              }}
              style={{ borderRadius: 12, opacity: activeItem?.job_time === role.job_time ? 0 : 1 }}
            >
              <motion.div
                layoutId={
                  activeItem?.job_time === role.job_time
                    ? undefined
                    : `workItemLogo-${role.job_time}`
                }
              >
                {role.logo}
              </motion.div>
              <div className="flex w-full flex-col items-start justify-between gap-0.5">
                {/* Day Number and Date Row */}
                <motion.div
                  className="text-ocean-100 text-sm font-medium flex items-center gap-2"
                  layoutId={
                    activeItem?.job_time === role.job_time
                      ? undefined
                      : `workItemDayDate-${role.job_time}`
                  }
                >
                  <span>{formatDayLabel(role.dayNumber)}</span>
                  {role.dayNumber !== undefined && (
                    <>
                      <Circle className="w-1.5 h-1.5 fill-current" />
                      <span>{role.title}</span>
                    </>
                  )}
                </motion.div>

                <motion.div
                  className="text-white font-bold text-lg group-hover:text-ocean-200 transition-colors"
                  layoutId={
                    activeItem?.job_time === role.job_time
                      ? undefined
                      : `workItemCompany-${role.job_time}`
                  }
                >
                  {role.company}
                </motion.div>
                <motion.div
                  className="text-ocean-200 text-sm"
                  layoutId={
                    activeItem?.job_time === role.job_time
                      ? undefined
                      : `workItemTitle-${role.job_time}`
                  }
                >
                  {role.salary}
                </motion.div>

                {/* All Aboard Time - Frosted Pink/Red Badge */}
                {role.remote && (
                  <motion.div
                    className="flex flex-row gap-2 text-sm mt-1"
                    layoutId={
                      activeItem?.job_time === role.job_time
                        ? undefined
                        : `workItemExtras-${role.job_time}`
                    }
                  >
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 backdrop-blur-sm border border-pink-300/30 text-pink-100 text-xs font-semibold shadow-md">
                      All Aboard: {role.remote}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
