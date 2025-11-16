import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    container?: HTMLElement;
  }
>(({ className, align = 'center', sideOffset = 4, container, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Combine refs
  React.useImperativeHandle(ref, () => contentRef.current as any);

  // Remove aria-hidden when content is mounted and watch for changes
  React.useEffect(() => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const wrapper = element.closest('[data-radix-popper-content-wrapper]');

    // Function to remove aria-hidden
    const removeAriaHidden = () => {
      // Remove from element
      if (element.getAttribute('aria-hidden') === 'true') {
        element.removeAttribute('aria-hidden');
      }
      if (element.getAttribute('data-aria-hidden') === 'true') {
        element.removeAttribute('data-aria-hidden');
      }

      // Remove from wrapper
      if (wrapper) {
        if (wrapper.getAttribute('aria-hidden') === 'true') {
          wrapper.removeAttribute('aria-hidden');
        }
        if (wrapper.getAttribute('data-aria-hidden') === 'true') {
          wrapper.removeAttribute('data-aria-hidden');
        }
      }
    };

    // Remove immediately
    removeAriaHidden();

    // Watch for changes using MutationObserver
    const observer = new MutationObserver(() => {
      removeAriaHidden();
    });

    // Observe the element and wrapper
    if (element) {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['aria-hidden', 'data-aria-hidden'],
        subtree: true,
      });
    }
    if (wrapper) {
      observer.observe(wrapper, {
        attributes: true,
        attributeFilter: ['aria-hidden', 'data-aria-hidden'],
      });
    }

    return () => observer.disconnect();
  }, [props['data-state']]);

  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={contentRef}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-[100] w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]',
          className
        )}
        aria-hidden={false}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
