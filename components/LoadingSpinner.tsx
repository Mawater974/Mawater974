import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoadingSpinner() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        <Image
          src="/TireSpinnerLoading.svg"
          alt="Loading spinner"
          width={64}
          height={64}
          priority
          className="animate-spin"
        />
      </div>
      <span className="ml-2 text-qatar-maroon dark:text-qatar-maroon-light">{t('auth.loading')}</span>
    </div>
  );
}
