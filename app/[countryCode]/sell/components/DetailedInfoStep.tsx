import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { scrollToTop } from '@/utils/scrollToTop';

// Simple input component with consistent styling
const Input = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
  error = false,
  ...props
}: {
  id?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  [key: string]: any;
}) => (
  <input
    id={id}
    type={type}
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-2 border ${
      error ? 'border-red-500' : 'border-gray-300'
    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar-gold focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
      className
    }`}
    {...props}
  />
);

// Simple label component
const Label = ({
  htmlFor,
  children,
  className = '',
  required = false,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className}`}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

// Simple select component
const Select = ({
  id,
  value,
  onChange,
  children,
  className = '',
  disabled = false,
  placeholder = '',
  error = false,
}: {
  id?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
}) => (
  <select
    id={id}
    value={value || ''}
    onChange={onChange}
    disabled={disabled}
    className={`w-full px-3 py-2 border ${
      error ? 'border-red-500' : 'border-gray-300'
    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar-gold focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

const SelectItem = ({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) => (
  <option value={value}>
    {children}
  </option>
);

interface CityOption {
  id: number | string;
  name: string;
  name_ar?: string;
  country_id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

type FormField = {
  id: string;
  name: string;
  type: string;
  options?: string[] | CityOption[];
  required?: boolean;
  colSpan?: number;
  optionValueKey?: string;
  optionLabelKey?: string;
};

type FormData = {
  brand_id: string;
  model_id: string;
  exact_model: string;
  year: string;
  mileage: string | number;
  price: string | number;
  description: string;
  city: string;
  [key: string]: any;
};

type DetailedInfoStepProps = {
  formData: FormData;
  onFormChange: <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => void;
  onNext: () => void;
  onBack?: () => void; // Add onBack prop
  t: (key: string, values?: Record<string, any>) => string;
  errors: Partial<Record<keyof FormData, string>>;
  fields: FormField[];
  cities?: CityOption[];
  currentLanguage?: string;
};

export function DetailedInfoStep({ 
  formData, 
  onFormChange, 
  onNext,
  onBack,
  t, 
  errors: propErrors,
  fields,
  cities = [],
  currentLanguage = 'en'
}: DetailedInfoStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(propErrors || {});
  const [showErrors, setShowErrors] = useState(false);
  
  const validateFields = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.id as keyof FormData]) {
        newErrors[field.id as keyof FormData] = t(`errors.${field.id}_required`);
      }
    });
    
    setErrors(newErrors);
    setShowErrors(Object.keys(newErrors).length > 0);
    
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateFields()) {
      onNext();
      scrollToTop();
    } else {
      scrollToTop();
    }
  };
  
  // Scroll to top on component mount
  useEffect(() => {
    scrollToTop();
  }, []);
  // Wrapper for onFormChange to clear errors when field is edited
  const handleFieldChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    onFormChange(field, value);
    
    // Clear error for the current field when user types/selects
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderInputField = (field: FormField) => {
    const value = formData[field.id] ?? '';
    
    // Handle select inputs
    if (field.type === 'select' && field.options) {
      return (
        <Select 
          value={value as string}
          onChange={(e) => handleFieldChange(field.id as keyof FormData, e.target.value as FormData[keyof FormData])}
          placeholder={t('common.select')}
          error={!!errors[field.id]}
        >
          {field.options.map((option) => {
            // Handle both string options and object options
            if (typeof option === 'string') {
              return (
                <option key={option} value={option}>
                  {option}
                </option>
              );
            } else {
              // For object options, use the provided keys or default to id/name
              const valueKey = field.optionValueKey || 'id';
              const labelKey = field.optionLabelKey || (currentLanguage === 'ar' && 'name_ar' ? 'name_ar' : 'name');
              return (
                <option key={option[valueKey as keyof typeof option]} value={option[valueKey as keyof typeof option]}>
                  {String(option[labelKey as keyof typeof option] || option[valueKey as keyof typeof option] || '')}
                </option>
              );
            }
          })}
        </Select>
      );
    }

    // Handle textarea input
    if (field.type === 'textarea') {
      return (
        <textarea
          id={field.id}
          value={value as string}
          onChange={(e) => handleFieldChange(field.id as keyof FormData, e.target.value as FormData[keyof FormData])}
          placeholder={field.name}
          className={`w-full px-3 py-2 border ${
            errors[field.id] ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar-gold focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[100px]`}
        />
      );
    }

    // Handle regular input fields
    return (
      <Input
        id={field.id}
        type={field.type}
        value={value as string | number}
        onChange={(e) => handleFieldChange(field.id as keyof FormData, e.target.value as FormData[keyof FormData])}
        placeholder={field.name}
        error={!!errors[field.id]}
      />
    );
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          {t('sell.details.title')}
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-300 text-center">
          {t('sell.details.subtitle')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {fields.map((field) => (
          field ? (
            <div key={field.id} className={`space-y-2 ${field.colSpan ? `col-span-${field.colSpan}` : ''}`}>
              <Label htmlFor={field.id} required={field.required}>
                {field.name}
              </Label>
              {renderInputField(field)}
              {errors[field.id] && (
                <p className="text-sm text-red-500">{errors[field.id]}</p>
              )}
            </div>
          ) : null
        ))}
      </div>
      
      <div className="flex justify-between">
        {onBack && (
          <Button 
            type="button"
            variant="outline"
            onClick={() => {
              onBack();
              scrollToTop();
            }}
            className="flex items-center gap-2 hover:shadow-md"
          >
            {t('common.back')}
          </Button>
        )}
        <Button 
          type="submit"
          className="bg-qatar-maroon hover:bg-qatar-maroon/90 text-white ml-auto hover:shadow-md"
        >
          {t('common.next')}
        </Button>
      </div>
    </form>
  );
}
