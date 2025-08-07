import React, { useEffect, useState } from 'react';
import { Database } from "@/types/supabase";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

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
      } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar-gold focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
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
        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar-gold focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
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

type Brand = Database['public']['Tables']['brands']['Row']
type Model = Database['public']['Tables']['models']['Row']

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
  t: (key: string) => string;
  errors: { [key: string]: string };
  brands: Brand[];
  onBrandChange: (brandId: string) => void;
  currentCountry: { id: number; currency_code: string; } | null;
}

export default function BasicInfoStep({
  formData,
  onFormChange,
  t,
  errors,
  brands,
  onBrandChange,
  currentCountry
}: BasicInfoStepProps) {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const supabase = createClientComponentClient<Database>();
  const currentYear = new Date().getFullYear();
  const { currentLanguage } = useLanguage();
  const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

  const handleBrandChange = async (value: string) => {
    const brandId = value;
    onFormChange('brand_id', brandId);
    onFormChange('model_id', ''); // Reset model when brand changes
    
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
    };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          {t('sell.basic.title')}
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-300 text-center">
          {t('sell.basic.subtitle')}
        </p>
      </div>

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
    </div>
  );
}
