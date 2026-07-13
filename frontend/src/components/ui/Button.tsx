import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-text hover:bg-primary-hover',
  secondary: 'bg-surface text-text border border-border hover:bg-hover',
  ghost: 'bg-transparent text-text-secondary hover:bg-hover hover:text-text',
  danger: 'bg-danger text-white hover:bg-danger-hover',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium',
          'transition-colors duration-150 ease-in-out',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
