import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
  {
    variants: {
      tone: {
        neutral: 'border-white/10 bg-white/5 text-slate-300',
        info: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
        success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
        warning: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
        danger: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'border-cyan-400/40 bg-cyan-400/15 text-cyan-50 hover:bg-cyan-400/20',
        secondary: 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10',
        warning: 'border-amber-400/40 bg-amber-400/15 text-amber-100 hover:bg-amber-400/20',
        ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-white/5',
        danger: 'border-rose-400/40 bg-rose-400/15 text-rose-100 hover:bg-rose-400/20',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
);

export function ShellCard({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/8 bg-slate-950/70 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}

export function Button({ className, variant, ...props }) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export function Badge({ className, tone, ...props }) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
