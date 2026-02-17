'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-black text-white hover:bg-gray-800',
      secondary: 'bg-white text-black border border-gray-300 hover:border-gray-400',
      ghost: 'bg-transparent text-gray-600 hover:text-black',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-5 text-sm rounded-full',
      lg: 'h-12 px-6 text-base rounded-full',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-1">
            <span className="loading-dot h-1 w-1 rounded-full bg-current" />
            <span className="loading-dot h-1 w-1 rounded-full bg-current" />
            <span className="loading-dot h-1 w-1 rounded-full bg-current" />
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
