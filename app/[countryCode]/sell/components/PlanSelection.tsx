import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountry } from "@/contexts/CountryContext";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Check icon component
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type Plan = {
  id: string
  name: string
  price: string
  features: string[]
  isPopular?: boolean
}

type PlanType = 'free' | 'featured' | null;

type PlanSelectionProps = {
  onSelectPlan: (isFeatured: boolean | null) => void
  onContinue?: () => void
  t: (key: string) => string
  currentPlan: PlanType
}

export function PlanSelection({ onSelectPlan, onContinue, t, currentPlan }: PlanSelectionProps) {
  const { currentCountry } = useCountry()
  const supabase = createClientComponentClient()
  const [featuredPrice, setFeaturedPrice] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan || null);

  useEffect(() => {
    const fetchFeaturedPrice = async () => {
      try {
        if (currentCountry?.id) {
          const { data } = await supabase
            .from('featured_prices')
            .select('price')
            .eq('country_id', currentCountry.id)
            .single();
          
          if (data) {
            setFeaturedPrice(data.price);
          }
        }
      } catch (error) {
        console.error('Error fetching featured price:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentCountry?.id) {
      fetchFeaturedPrice();
    }
  }, [currentCountry?.id]);

  useEffect(() => {
    setSelectedPlan(currentPlan || null);
  }, [currentPlan]);

  const handleSelectPlan = (planType: PlanType) => {
    const newPlan = selectedPlan === planType ? null : planType;
    setSelectedPlan(newPlan);
  };

  const handleContinue = () => {
    if (selectedPlan !== null) {
      onSelectPlan(selectedPlan === 'featured');
      if (onContinue) {
        onContinue();
      }
    }
  };

  const features = {
    free: [
        t('sell.features.basic.visibility'),
        t('sell.features.basic.photos'),
        t('sell.features.basic.search'),
        t('sell.features.basic.details'),
        t('sell.features.basic.duration'),
        t('sell.features.basic.support')
    ],
    featured: [
        t('sell.features.featured.visibility'),
        t('sell.features.featured.photos'),
        t('sell.features.featured.search'),
        t('sell.features.featured.details'),
        t('sell.features.featured.duration'),
        t('sell.features.featured.support'),
        t('sell.features.featured.badge'),
        t('sell.features.featured.social'),
        t('sell.features.featured.analytics')
    ]
  } as const;

  return (
    <div className="w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-8 w-full">
          {/* Free Plan */}
          <div 
            className={`rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${
              selectedPlan === 'free' 
                ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => handleSelectPlan('free')}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('sell.plans.free.title')}
              </h3>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {t('sell.plans.free.description')}
              </p>
              <div className="mt-8">
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {t('sell.plans.free.price')}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('sell.plans.free.duration')}
                </p>
              </div>
              <div className="mt-8 block w-full">
                <span className={`inline-flex items-center justify-center w-full rounded-md py-2 px-3 text-sm font-semibold ${
                  selectedPlan === 'free'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                }`}>
                  {selectedPlan === 'free' ? t('common.selected') : t('common.select')}
                </span>
              </div>
            </div>
            <div className="px-6 pt-6 pb-8">
              <h4 className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wide">
                {t('sell.whatsIncluded')}
              </h4>
              <ul className="mt-6 space-y-4">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex">
                    <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Featured Plan */}
          <div 
            className={`rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${
              selectedPlan === 'featured'
                ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => handleSelectPlan('featured')}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('sell.plans.featured.title')}
                </h3>
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {t('common.popular')}
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {t('sell.plans.featured.description')}
              </p>
              <div className="mt-8">
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {loading ? '...' : `${featuredPrice} ${currentCountry?.currency || ''}`}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('sell.plans.featured.duration')}
                </p>
              </div>
              <div className="mt-8 block w-full">
                <span className={`inline-flex items-center justify-center w-full rounded-md py-2 px-3 text-sm font-semibold ${
                  selectedPlan === 'featured'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50'
                }`}>
                  {selectedPlan === 'featured' ? t('common.selected') : t('common.select')}
                </span>
              </div>
            </div>
            <div className="px-6 pt-6 pb-8">
              <h4 className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wide">
                {t('sell.whatsIncluded')}
              </h4>
              <ul className="mt-6 space-y-4">
                {features.featured.map((feature, index) => (
                  <li key={index} className="flex">
                    <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          </div>
          
          <div className="flex justify-end mt-8">
            <Button 
              onClick={handleContinue}
              disabled={selectedPlan === null}
              className="px-8 py-3 text-lg"
            >
              {t('common.continue')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
