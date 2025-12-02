import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { scrollToTop } from '@/utils/scrollToTop';

// Simple form input components with consistent styling
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={`w-full px-3 py-2 border ${
        error ? 'border-red-500' : 'border-gray-300'
      } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
        props.disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    />
  )
);
Input.displayName = 'Input';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label: React.FC<LabelProps> = ({
  children,
  className = '',
  required = false,
  ...props
}) => (
  <label
    {...props}
    className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className}`}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      value,
      onChange,
      onValueChange,
      children,
      className = '',
      disabled = false,
      placeholder,
      error = false,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    return (
      <select
        ref={ref}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full px-3 py-2 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

type Brand = Database['public']['Tables']['brands']['Row'] & {
  name_ar?: string;
};

type Model = Database['public']['Tables']['models']['Row'] & {
  name_ar?: string;
};

// Use the same FormData type as in page.tsx
type FormData = {
  brand_id?: string;
  model_id?: string;
  exact_model?: string;
  year?: string;
  mileage?: string | number;
  price?: string | number;
};

interface BasicInfoStepProps {
  formData: FormData;
  onFormChange: (field: string, value: string | number | undefined) => void;
  onNext: () => void;
  onBack?: () => void; // Add onBack prop
  t: (key: string) => string;
  errors: { [key: string]: string };
  brands: Brand[];
  onBrandChange: (brandId: string) => void;
  currentCountry: { id: number; currency_code: string; } | null;
}

export default function BasicInfoStep({
  formData,
  onFormChange,
  onNext,
  onBack,
  t,
  errors: propErrors,
  brands,
  onBrandChange,
  currentCountry
}: BasicInfoStepProps) {
  const [errors, setErrors] = useState<{[key: string]: string}>(propErrors || {});
  const [showErrors, setShowErrors] = useState(false);
  
  const validateFields = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.brand_id) {
      newErrors.brand_id = t('errors.brand_required');
    }
    if (!formData.model_id) {
      newErrors.model_id = t('errors.model_required');
    }
    if (!formData.year) {
      newErrors.year = t('errors.year_required');
    }
    if (!formData.mileage) {
      newErrors.mileage = t('errors.mileage_required');
    }
    if (!formData.price) {
      newErrors.price = t('errors.price_required');
    }
    
    setErrors(newErrors);
    setShowErrors(Object.keys(newErrors).length > 0);
    
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
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
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const supabase = createClientComponentClient<Database>();
  const currentYear = new Date().getFullYear();
  const { currentLanguage } = useLanguage();
  // Extend the range to include next year (2026)
  const years = Array.from({ length: 31 }, (_, i) => (currentYear + 1 - i).toString());

  const handleBrandChange = async (value: string) => {
    const brandId = value;
    onFormChange('brand_id', brandId);
    onFormChange('model_id', ''); // Reset model when brand changes
    
    // Clear brand_id error when user selects a brand
    if (errors.brand_id) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.brand_id;
        return newErrors;
      });
    }
    
    // Call the onBrandChange prop if provided
    if (onBrandChange) {
      onBrandChange(brandId);
    }
    
    if (brandId) {
      try {
        const { data: modelsData, error } = await supabase
          .from('models')
          .select('*')
          .eq('brand_id', brandId)
          .order('name');
        
        if (error) throw error;
        
        setAvailableModels(modelsData || []);
      } catch (error) {
        console.error('Error fetching models:', error);
        toast.error(t('errors.fetch_models_failed'));
      }
    } else {
      setAvailableModels([]);
    }
  };

  const handleInputChange = <K extends keyof FormData>(field: K) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onFormChange(field, e.target.value as FormData[K]);
      
      // Clear error for the current field when user types/selects
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          {t('sell.basic.title')}
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-300 text-center">
          {t('sell.basic.subtitle')}
        </p>
      </div>
      
      {showErrors && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-200 font-medium">
                {t('errors.required_fields')}
              </p>
              <ul className="list-disc pl-5 mt-1 text-sm text-red-700 dark:text-red-200">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Brand */}
        <div className="space-y-2">
          <Label htmlFor="brand" required>{t('sell.basic.brand')}</Label>
          <Select
            id="brand"
            value={formData.brand_id || ''}
            onChange={(e) => handleBrandChange(e.target.value)}
            placeholder={t('sell.basic.brand.select')}
            error={!!errors.brand_id}
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {currentLanguage === 'ar' && brand.name_ar ? brand.name_ar : brand.name}
              </option>
            ))}
          </Select>
          {errors.brand_id && (
            <p className="text-red-500 text-sm mt-1">{errors.brand_id}</p>
          )}
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label htmlFor="model" required>{t('sell.basic.model')}</Label>
          <Select
            id="model"
            value={formData.model_id || ''}
            onChange={handleInputChange('model_id')}
            disabled={!formData.brand_id}
            placeholder={formData.brand_id ? t('sell.basic.model.select') : t('sell.basic.select.brand.first')}
            error={!!errors.model_id}
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {currentLanguage === 'ar' && model.name_ar ? model.name_ar : model.name}
              </option>
            ))}
          </Select>
          {errors.model_id && (
            <p className="text-red-500 text-sm mt-1">{errors.model_id}</p>
          )}
        </div>

        {/* Exact Model */}
        <div className="space-y-2">
          <Label htmlFor="exact_model">{t('sell.basic.exactModel')}</Label>
          <Input
            id="exact_model"
            type="text"
            value={formData.exact_model || ''}
            onChange={handleInputChange('exact_model')}
            placeholder={t('sell.basic.exactModel.placeholder')}
            error={!!errors.exact_model}
          />
          {errors.exact_model && (
            <p className="text-red-500 text-sm mt-1">{errors.exact_model}</p>
          )}
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label htmlFor="year" required>{t('sell.basic.year')}</Label>
          <Select
            id="year"
            value={formData.year || ''}
            onChange={handleInputChange('year')}
            placeholder={t('sell.basic.year.select')}
            error={!!errors.year}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
          {errors.year && (
            <p className="text-red-500 text-sm mt-1">{errors.year}</p>
          )}
        </div>

        {/* Mileage */}
        <div className="space-y-2">
          <Label htmlFor="mileage" required>{t('sell.basic.mileage')} (km)</Label>
          <div className="relative">
            <Input
              id="mileage"
              type="number"
              min="0"
              value={formData.mileage || ''}
              onChange={handleInputChange('mileage')}
              placeholder="0"
              className="pr-12"
              error={!!errors.mileage}
            />
            <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
              km
            </span>
          </div>
          {errors.mileage && (
            <p className="text-red-500 text-sm mt-1">{errors.mileage}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price" required>{t('sell.basic.price')} ({currentCountry?.currency_code})</Label>
          <div className="relative">
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.price || ''}
              onChange={handleInputChange('price')}
              placeholder="0"
              className="pr-12"
              error={!!errors.price}
            />
            <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
              {currentCountry?.currency_code}
            </span>
          </div>
          {errors.price && (
            <p className="text-red-500 text-sm mt-1">{errors.price}</p>
          )}
        </div>
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
