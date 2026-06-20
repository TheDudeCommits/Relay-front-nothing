import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition duration-150 cursor-pointer select-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 focus-visible:outline-none';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-bg hover:bg-white',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-muted hover:text-ink',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-[13px]',
  md: 'px-4 py-2.5 text-sm',
};

/** Shared className for buttons (also usable on Links styled as buttons). */
export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return `${base} ${variantStyles[variant]} ${sizeStyles[size]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  return (
    <button className={`${buttonStyles(variant, size)} ${className ?? ''}`} {...rest}>
      {children}
    </button>
  );
}
