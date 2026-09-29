import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,transform,opacity] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-hover',
        secondary: 'bg-fill text-label hover:bg-fill-strong',
        tinted: 'bg-accent-soft text-accent hover:bg-accent-soft/80',
        ghost: 'text-label hover:bg-fill',
        link: 'text-link hover:underline underline-offset-4 px-0',
        danger: 'bg-red text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3.5 text-[13px] [&_svg]:size-3.5',
        md: 'h-10 px-5 text-[15px] [&_svg]:size-4',
        lg: 'h-12 px-7 text-[17px] [&_svg]:size-[18px]',
        icon: 'size-9 [&_svg]:size-[18px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
