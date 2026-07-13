import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'default' | 'danger';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  default: 'text-text-secondary hover:bg-hover hover:text-text',
  danger: 'text-text-secondary hover:bg-danger-bg hover:text-danger',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, tone = 'default', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 ease-in-out',
          'disabled:cursor-not-allowed disabled:opacity-50',
          toneClasses[tone],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
