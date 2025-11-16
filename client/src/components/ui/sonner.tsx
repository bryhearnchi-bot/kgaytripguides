import { Toaster as Sonner } from 'sonner';
import { useEffect } from 'react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  useEffect(() => {
    // Add custom CSS to position toasts above navigation bar
    // Navigation bar height: ~60px (pt-1.5 + pt-2.5 + icon 24px + gap 2px + text ~12px + py-1)
    // Plus safe area padding for mobile devices
    const style = document.createElement('style');
    style.textContent = `
      [data-sonner-toaster] {
        bottom: calc(60px + var(--nav-bottom-padding, 0px) + 8px) !important;
      }
      /* On desktop (xl breakpoint), navigation bar is hidden, use default spacing */
      @media (min-width: 1280px) {
        [data-sonner-toaster] {
          bottom: 1rem !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-gray-600',
          actionButton: 'group-[.toast]:bg-black group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700',
          success:
            'group-[.toaster]:!bg-white group-[.toaster]:!text-black group-[.toaster]:!border-green-500',
          error:
            'group-[.toaster]:!bg-white group-[.toaster]:!text-black group-[.toaster]:!border-red-500',
          warning:
            'group-[.toaster]:!bg-white group-[.toaster]:!text-black group-[.toaster]:!border-amber-500',
          info: 'group-[.toaster]:!bg-white group-[.toaster]:!text-black group-[.toaster]:!border-blue-500',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
