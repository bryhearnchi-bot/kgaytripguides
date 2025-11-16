import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white/10 group-[.toaster]:backdrop-blur-lg group-[.toaster]:text-white group-[.toaster]:border-white/20 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-white/70',
          actionButton: 'group-[.toast]:bg-amber-500 group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-white/10 group-[.toast]:text-white/70',
          success: 'group-[.toaster]:!bg-green-500/20 group-[.toaster]:!border-green-500/30',
          error: 'group-[.toaster]:!bg-red-500/20 group-[.toaster]:!border-red-500/30',
          warning: 'group-[.toaster]:!bg-amber-500/20 group-[.toaster]:!border-amber-500/30',
          info: 'group-[.toaster]:!bg-blue-500/20 group-[.toaster]:!border-blue-500/30',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
