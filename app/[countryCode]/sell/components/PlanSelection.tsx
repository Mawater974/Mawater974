import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext"
import { useCountry } from "@/contexts/CountryContext"

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

type PlanSelectionProps = {
  onSelectPlan: (plan: 'free' | 'featured') => void
  t: (key: string) => string
  currentPlan: 'free' | 'featured' | null
}

export function PlanSelection({ onSelectPlan, t, currentPlan }: PlanSelectionProps) {
  const { currentCountry } = useCountry()
  // Initialize with null to have no plan selected by default
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'featured' | null>(null)

  const handleSelectPlan = (plan: 'free' | 'featured') => {
    setSelectedPlan(plan)
    // Removed onSelectPlan call here to prevent auto-navigation
  }

  // Features for each plan
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
  }

  return (
    <div className=" w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-8 w-full">
          {/* Free Plan */}
          <div className={`rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${
            selectedPlan === 'free' 
              ? 'border-2 border-qatar-maroon' 
              : 'border border-gray-200 dark:border-gray-700'
          }`}>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">
              <h2 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">
                {t('sell.plan.free.title')}
              </h2>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
                {t('sell.plan.free.description')}
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {t('sell.plan.free.price')}
                </span>
              </p>
              <button
                type="button"
                onClick={() => handleSelectPlan('free')}
                className={`mt-8 block w-full py-2 px-3 text-sm font-semibold rounded-md text-center border-2 transition-all duration-300 ${
                  selectedPlan === 'free'
                    ? 'bg-qatar-maroon text-white border-qatar-maroon hover:bg-qatar-maroon/90'
                    : 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon/50 hover:bg-qatar-maroon/20 hover:border-qatar-maroon'
                }`}
              >
                {t('sell.plan.free.select')}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">
                {t('sell.plan.free.includes')}
              </h3>
              <ul role="list" className="mt-4 space-y-3">
                {features.free.map((feature) => (
                  <li key={feature} className="flex space-x-3">
                    <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Featured Plan */}
          <div className={`rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${
            selectedPlan === 'featured' 
              ? 'border-2 border-qatar-maroon' 
              : 'border border-gray-200 dark:border-gray-700'
          }`}>
            <div className="p-6">
              <h2 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">
                {t('sell.plan.featured.title')}
              </h2>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
                {t('sell.plan.featured.description')}
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {t(`sell.plan.featured.price.${currentCountry?.code?.toLowerCase() || '00'}`)} {t(`common.currency.${currentCountry?.currency_code}`)}
                </span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                  {t('sell.plan.featured.period')}
                </span>
              </p>
              <button
                type="button"
                onClick={() => handleSelectPlan('featured')}
                className={`mt-8 block w-full py-2 px-3 text-sm font-semibold rounded-md text-center border-2 transition-all duration-300 ${
                  selectedPlan === 'featured'
                    ? 'bg-qatar-maroon text-white border-qatar-maroon hover:bg-qatar-maroon/90'
                    : 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon/50 hover:bg-qatar-maroon/20 hover:border-qatar-maroon'
                }`}
              >
                {t('sell.plan.featured.select')}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">
                {t('sell.plan.featured.includes')}
              </h3>
              <ul role="list" className="mt-4 space-y-3">
                {features.featured.map((feature) => (
                  <li key={feature} className="flex space-x-3">
                    <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center col-span-2">
            <button
              onClick={() => selectedPlan && onSelectPlan(selectedPlan)}
              disabled={!selectedPlan}
              className={`inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                selectedPlan === 'featured' 
                  ? 'bg-qatar-maroon hover:bg-qatar-maroon/90' 
                  : 'bg-qatar-maroon hover:bg-qatar-maroon/90'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105`}
            >
              {selectedPlan 
                ? `${t('sell.plan.continue')} ${selectedPlan === 'free' ? t('sell.plan.free.title') : t('sell.plan.featured.title')}`
                : t('sell.plan.selectPlan')}
                
              <svg 
                className="ml-2 mr-1 w-5 h-5" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
            
           
          </div>
        </div>
      </div>
    </div>
  )
}
