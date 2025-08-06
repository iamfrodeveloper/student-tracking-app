'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'mobile' | 'tablet' | 'desktop' | 'auto';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveLayout({
  children,
  className,
  variant = 'auto',
  maxWidth = 'xl',
  padding = 'md'
}: ResponsiveLayoutProps) {
  const getLayoutClasses = () => {
    const baseClasses = 'w-full mx-auto';
    
    const maxWidthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-4xl',
      '2xl': 'max-w-6xl',
      full: 'max-w-full'
    };
    
    const paddingClasses = {
      none: '',
      sm: 'p-2 sm:p-4',
      md: 'p-4 sm:p-6 lg:p-8',
      lg: 'p-6 sm:p-8 lg:p-12',
      xl: 'p-8 sm:p-12 lg:p-16'
    };
    
    const variantClasses = {
      mobile: 'mobile-form-spacing',
      tablet: 'tablet-layout',
      desktop: 'desktop-layout',
      auto: 'mobile-form-spacing sm:tablet-layout lg:desktop-layout'
    };
    
    return cn(
      baseClasses,
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      variantClasses[variant],
      className
    );
  };

  return (
    <div className={getLayoutClasses()}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  minItemWidth?: string;
}

export function ResponsiveGrid({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  minItemWidth = '300px'
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const baseClasses = 'grid w-full';
    
    const gapClasses = {
      sm: 'gap-2 sm:gap-3',
      md: 'gap-4 sm:gap-6',
      lg: 'gap-6 sm:gap-8',
      xl: 'gap-8 sm:gap-12'
    };
    
    const columnClasses = `
      grid-cols-${columns.mobile}
      sm:grid-cols-${columns.tablet}
      lg:grid-cols-${columns.desktop}
    `;
    
    return cn(
      baseClasses,
      gapClasses[gap],
      columnClasses,
      className
    );
  };

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'mobile' | 'tablet' | 'desktop' | 'auto';
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveCard({
  children,
  className,
  variant = 'auto',
  padding = 'md',
  shadow = 'md'
}: ResponsiveCardProps) {
  const getCardClasses = () => {
    const baseClasses = 'bg-white rounded-lg border border-gray-200';
    
    const paddingClasses = {
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8'
    };
    
    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md hover:shadow-lg transition-shadow duration-200',
      lg: 'shadow-lg hover:shadow-xl transition-shadow duration-200'
    };
    
    const variantClasses = {
      mobile: 'mobile-card',
      tablet: 'rounded-xl',
      desktop: 'rounded-xl',
      auto: 'mobile-card sm:rounded-xl'
    };
    
    return cn(
      baseClasses,
      paddingClasses[padding],
      shadowClasses[shadow],
      variantClasses[variant],
      className
    );
  };

  return (
    <div className={getCardClasses()}>
      {children}
    </div>
  );
}

interface ResponsiveButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ResponsiveButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button'
}: ResponsiveButtonProps) {
  const getButtonClasses = () => {
    const baseClasses = `
      mobile-touch-target
      inline-flex items-center justify-center
      rounded-lg font-medium transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;
    
    const variantClasses = {
      primary: `
        bg-blue-600 text-white hover:bg-blue-700
        focus:ring-blue-500 active:bg-blue-800
      `,
      secondary: `
        bg-gray-100 text-gray-900 hover:bg-gray-200
        focus:ring-gray-500 active:bg-gray-300
      `,
      outline: `
        border border-gray-300 bg-white text-gray-700
        hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100
      `,
      ghost: `
        text-gray-700 hover:bg-gray-100
        focus:ring-gray-500 active:bg-gray-200
      `
    };
    
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-2.5 text-sm min-h-[44px]',
      lg: 'px-6 py-3 text-base min-h-[48px]',
      xl: 'px-8 py-4 text-lg min-h-[52px]'
    };
    
    const widthClasses = fullWidth ? 'w-full' : '';
    
    return cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      widthClasses,
      className
    );
  };

  return (
    <button
      type={type}
      className={getButtonClasses()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface ResponsiveInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'tel' | 'url';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric';
}

export function ResponsiveInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  error,
  helpText,
  className,
  autoComplete,
  inputMode
}: ResponsiveInputProps) {
  const inputId = label?.toLowerCase().replace(/\s+/g, '-') || 'input';
  
  const getInputClasses = () => {
    const baseClasses = `
      mobile-text-base w-full px-3 py-3 sm:py-2.5
      border rounded-lg transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    `;
    
    const stateClasses = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 hover:border-gray-400';
    
    return cn(baseClasses, stateClasses, className);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={getInputClasses()}
        autoComplete={autoComplete}
        inputMode={inputMode}
      />
      
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

export default ResponsiveLayout;
