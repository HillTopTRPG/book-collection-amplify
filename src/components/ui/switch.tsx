import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitives.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 bg-input',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-6 min-w-6 rounded-full data-[state=checked]:bg-foreground data-[state=unchecked]:bg-background data-[state=checked]:text-background data-[state=unchecked]:text-foreground border-2 border-foreground shadow-lg ring-0 transition-transform data-[state=checked]:-translate-x-5 data-[state=unchecked]:translate-x-[2px]'
      )}
    >
      {props.checked ? <Check width={20} height={20} /> : null}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
