import { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FeaturedPlan {
  id: string;
  name: string;
  name_ar: string;
  duration: number; // in days
  price: number;
  popular?: boolean;
  features: string[];
  features_ar: string[];
}

interface FeaturedPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: FeaturedPlan) => void;
  currency: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function FeaturedPlansModal({ isOpen, onClose, onSelectPlan, currency }: FeaturedPlansModalProps) {
  const { language, t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else {
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isMounted) return null;

  const plans: FeaturedPlan[] = [
    {
      id: 'monthly',
      name: 'Monthly',
      name_ar: 'شهري',
      duration: 30,
      price: 50,
      popular: false,
      features: [
        'Featured badge on your showroom',
        'Priority in search results',
        'Featured on homepage',
        '30 days visibility'
      ],
      features_ar: [
        'شارة مميزة على معرضك',
        'الأولوية في نتائج البحث',
        'مميز على الصفحة الرئيسية',
        'رؤية لمدة 30 يومًا'
      ]
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      name_ar: 'ربع سنوي',
      duration: 90,
      price: 120,
      popular: true,
      features: [
        'Everything in Monthly',
        'Save 20%',
        '90 days visibility',
        'Priority support'
      ],
      features_ar: [
        'كل ما في الباقة الشهرية',
        'وفر 20%',
        'رؤية لمدة 90 يومًا',
        'دعم متميز'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly',
      name_ar: 'سنوي',
      duration: 365,
      price: 400,
      popular: false,
      features: [
        'Everything in Quarterly',
        'Save 33%',
        '365 days visibility',
        'Highest priority',
        'Featured in newsletter'
      ],
      features_ar: [
        'كل ما في الباقة الربع سنوية',
        'وفر 33%',
        'رؤية لمدة 365 يومًا',
        'أعلى أولوية',
        'مميز في النشرة الإخبارية'
      ]
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const calculateMonthlyPrice = (price: number, duration: number) => {
    const monthly = price / (duration / 30);
    return formatPrice(monthly);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          
          <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-6xl mx-auto"
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-qatar-maroon p-6 sm:p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        {language === 'ar' ? 'خطط العضوية المميزة' : 'Featured Membership Plans'}
                      </h2>
                      <p className="mt-2 text-white">
                        {language === 'ar' 
                          ? 'اختر الخطة التي تناسب احتياجاتك' 
                          : 'Choose the plan that fits your needs'}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white/80 hover:text-white transition-colors p-1 -mt-1 -mr-1"
                      aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 sm:p-8">
                
                <motion.div 
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
                >
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      variants={item}
                      className={`relative flex flex-col rounded-xl overflow-hidden transition-all duration-300 ${
                        selectedPlan === plan.id 
                          ? 'ring-2 ring-qatar-maroon shadow-lg scale-[1.02]' 
                          : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-md'
                      } ${plan.popular ? 'border-t-4 border-qatar-gold' : ''}`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-qatar-gold text-qatar-maroon text-xs font-bold px-3 py-1 rounded-bl-lg">
                          {language === 'ar' ? 'الأكثر اختياراً' : 'MOST POPULAR'}
                        </div>
                      )}
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {language === 'ar' ? plan.name_ar : plan.name}
                          </h3>
                          
                          <div className="mt-4">
                            <div className="flex items-baseline">
                              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                {formatPrice(plan.price)}
                              </span>
                              <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                {language === 'ar' 
                                  ? `لمدة ${plan.duration} يوم`
                                  : `for ${plan.duration} days`}
                              </span>
                            </div>
                            
                            <p className="mt-1 text-sm text-qatar-gold">
                              {language === 'ar'
                                ? `(${calculateMonthlyPrice(plan.price, plan.duration)} ${t('common.monthly')})`
                                : `(${calculateMonthlyPrice(plan.price, plan.duration)} ${t('common.monthly')})`}
                              }
                            </p>
                          </div>
                          
                          <div className="mt-6 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                              {language === 'ar' ? 'المميزات' : 'FEATURES'}
                            </h4>
                            <ul className="space-y-3">
                              {(language === 'ar' ? plan.features_ar : plan.features).map((feature, idx) => (
                                <li key={idx} className="flex items-start">
                                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(plan.id);
                            setTimeout(() => onSelectPlan(plan), 100);
                          }}
                          className={`mt-8 w-full flex items-center justify-center px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                            selectedPlan === plan.id
                              ? 'bg-qatar-maroon text-white shadow-lg'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {selectedPlan === plan.id ? (
                            <>
                              {language === 'ar' ? 'تم الاختيار' : 'Selected'}
                              <CheckCircleIcon className="ml-2 h-5 w-5" />
                            </>
                          ) : (
                            <>
                              {language === 'ar' ? 'اختر الخطة' : 'Select Plan'}
                              <ArrowRightIcon className="mr-2 h-5 w-5" />
                            </>
                          )}
                        </motion.button>
                      </div>
                      
                      {plan.popular && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-qatar-gold" />
                      )}
                    </motion.div>
                  ))}
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-10 text-center"
                >
                  
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    {language === 'ar' 
                      ? 'يتم تجديد الاشتراك تلقائياً. يمكنك الإلغاء في أي وقت. نضمن استرداد الأموال خلال 7 أيام إذا لم تكن راضياً عن الخدمة.'
                      : 'Subscription auto-renews. Cancel anytime. 7-day money-back guarantee if you\'re not satisfied.'}
                    }
                  </p>
                  
                  
                </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
