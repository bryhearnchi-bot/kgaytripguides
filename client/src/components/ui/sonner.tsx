import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
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
