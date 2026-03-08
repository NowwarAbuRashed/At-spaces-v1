import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/70',
  {
    variants: {
      variant: {
        primary:
          'bg-app-accent text-white shadow-glow hover:brightness-110 active:brightness-95',
        secondary:
          'bg-app-surface-alt text-app-text border border-app-border hover:border-app-accent/40',
        outline:
          'border border-app-border bg-transparent text-app-text hover:border-app-accent/50 hover:text-white',
        ghost: 'bg-transparent text-app-muted hover:bg-app-surface-alt hover:text-app-text',
        danger:
          'bg-app-danger/90 text-white shadow-[0_8px_24px_rgba(239,68,68,0.25)] hover:bg-app-danger',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-5 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
