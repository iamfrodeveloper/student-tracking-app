'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ValidationStatus = 'idle' | 'validating' | 'success' | 'error';

interface ValidationFeedbackProps {
  status: ValidationStatus;
  message?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ValidationFeedback({ 
  status, 
  message, 
  className,
  showIcon = true,
  size = 'md'
}: ValidationFeedbackProps) {
  if (status === 'idle' && !message) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'validating':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <Loader2 className={cn(iconSizes[size], 'animate-spin text-blue-600')} />
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: <CheckCircle className={cn(iconSizes[size], 'text-green-600')} />
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: <AlertCircle className={cn(iconSizes[size], 'text-red-600')} />
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: <Info className={cn(iconSizes[size], 'text-gray-600')} />
        };
    }
  };

  const { container, icon } = getStatusStyles();

  return (
    <div className={cn(
      'flex items-start gap-2 rounded-md border transition-all duration-200',
      sizeClasses[size],
      container,
      className
    )}>
      {showIcon && (
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
      )}
      {message && (
        <div className="flex-1 min-w-0">
          <p className="font-medium leading-tight">{message}</p>
        </div>
      )}
    </div>
  );
}

interface ValidationInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidate?: (value: string) => Promise<{ success: boolean; message: string }>;
  placeholder?: string;
  type?: 'text' | 'password' | 'textarea';
  required?: boolean;
  validationStatus: ValidationStatus;
  validationMessage?: string;
  className?: string;
  rows?: number;
  helpText?: string;
}

export function ValidationInput({
  label,
  value,
  onChange,
  onValidate,
  placeholder,
  type = 'text',
  required = false,
  validationStatus,
  validationMessage,
  className,
  rows = 3,
  helpText
}: ValidationInputProps) {
  const [isValidating, setIsValidating] = React.useState(false);

  const handleChange = async (newValue: string) => {
    onChange(newValue);
    
    if (onValidate && newValue.trim()) {
      setIsValidating(true);
      try {
        await onValidate(newValue);
      } finally {
        setIsValidating(false);
      }
    }
  };

  const getInputStyles = () => {
    switch (validationStatus) {
      case 'success':
        return 'border-green-300 focus:border-green-500 focus:ring-green-500';
      case 'error':
        return 'border-red-300 focus:border-red-500 focus:ring-red-500';
      case 'validating':
        return 'border-blue-300 focus:border-blue-500 focus:ring-blue-500';
      default:
        return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    }
  };

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';
  const inputProps = {
    id: label.toLowerCase().replace(/\s+/g, '-'),
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleChange(e.target.value),
    placeholder,
    required,
    className: cn(
      'w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-opacity-50',
      'disabled:bg-gray-50 disabled:text-gray-500',
      getInputStyles(),
      className
    ),
    disabled: isValidating,
    ...(type === 'password' && { type: 'password' }),
    ...(type === 'textarea' && { rows })
  };

  return (
    <div className="space-y-2">
      <label 
        htmlFor={inputProps.id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <InputComponent {...inputProps} />
        
        {(isValidating || validationStatus === 'validating') && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          </div>
        )}
      </div>
      
      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      <ValidationFeedback
        status={validationStatus}
        message={validationMessage}
        size="sm"
      />
    </div>
  );
}

export default ValidationFeedback;
