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
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    const fetchFeaturedPrice = async () => {
      try {
        if (currentCountry?.id) {
          const { data } = await supabase
            .from('featured_ad_pricing')
            .select('price, currency_code')
            .eq('country_id', currentCountry.id)
            .single();
          
          if (data) {
            const formattedPrice = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: data.currency_code
            }).format(data.price);
            setFeaturedPrice(formattedPrice);
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
    if (planType === 'featured') {
      setShowComingSoon(true);
      // Don't select the featured plan, keep the current selection
      return;
    }
    const newPlan = selectedPlan === planType ? null : planType;
    setSelectedPlan(newPlan);
    setShowComingSoon(false);
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
      <div className="w-full max-w-7xl mx-auto ">
        <div className="space-y-8">
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {/* Free Plan */}
          <div 
            className={`rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${
              selectedPlan === 'free' 
                ? 'border-2 border-qatar-maroon dark:border-qatar-maroon' 
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => handleSelectPlan('free')}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('sell.plan.free.title')}
              </h3>
              
              <div className="mt-2">
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {t('sell.plan.free.price')}
                </p>
              </div>
              <div className="mt-2 block w-full">
                <span className={`mt-4 block w-full py-2 px-3 text-sm font-semibold rounded-md text-center border-2 transition-all duration-300  ${
                  selectedPlan === 'free'
                    ? 'bg-qatar-maroon text-white border-qatar-maroon hover:bg-qatar-maroon/90'
                    : 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon/50 hover:bg-qatar-maroon/20 hover:border-qatar-maroon'
                }`}>
                  {selectedPlan === 'free' ? t('sell.plan.free.selected') : t('sell.plan.free.select')}
                </span>
              </div>
            </div>
            <div className="px-6 pt-6 pb-8">
              
              <ul className="mt-2 space-y-4">
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
                ? 'border-2 border-qatar-maroon dark:border-qatar-maroon'
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => handleSelectPlan('featured')}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('sell.plan.featured.title')}
                </h3>
              </div>
              
              <div className="mt-2">
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {loading ? '...' : featuredPrice || '...'}
                </p>
              </div>
              <div className="mt-2 block w-full">
                <span className={`mt-4 block w-full py-2 px-3 text-sm font-semibold rounded-md text-center border-2 transition-all duration-300 ${
                  selectedPlan === 'featured'
                    ? 'bg-gray-400 text-white border-gray-400 cursor-not-allowed'
                    : 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon/50 hover:bg-qatar-maroon/20 hover:border-qatar-maroon'
                }`}>
                  {t('sell.plan.featured.comingSoon')}
                </span>
                {showComingSoon && (
                  <div className="mt-2 text-sm text-qatar-maroon dark:text-qatar-maroon-light">
                    {t('sell.plan.featured.comingSoonMessage')}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pt-6 pb-8">
              
              <ul className="mt-2 space-y-4">
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
          
          <div className="mt-8 text-center">
              <button
                onClick={handleContinue}
                disabled={!selectedPlan || selectedPlan === 'featured'}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                  selectedPlan === 'featured' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-qatar-maroon hover:bg-qatar-maroon/90 focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon'
                } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedPlan 
                  ? selectedPlan === 'free' 
                    ? t('sell.plan.continueToFree')
                    : t('sell.plan.continueToFeatured')
                  : t('sell.plan.selectPlan')}
              </button>
          </div>
        </div>
      </div>
    </div>
  )
}
