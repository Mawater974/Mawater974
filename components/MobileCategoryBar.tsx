"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';



export default function MobileCategoryBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { currentCountry } = useCountry();

  const categories = [
    { name: t('nav.home'), href: `/${currentCountry?.code.toLowerCase()}` },
    { name: t('nav.browseCars'), href: `/${currentCountry?.code.toLowerCase()}/cars` },
    { name: t('nav.sellYourCar'), href: `/${currentCountry?.code.toLowerCase()}/sell` },
    { name: t('nav.showrooms'), href: `/${currentCountry?.code.toLowerCase()}/showrooms` },
    { name: t('nav.carRental'), href: `/${currentCountry?.code.toLowerCase()}/car-rental` },
    { name: t('nav.spareParts'), href: `/${currentCountry?.code.toLowerCase()}/spare-parts` },
    { name: t('nav.carPhotography'), href: `/${currentCountry?.code.toLowerCase()}/car-photography` },
  ];
  return (
    <div className="w-full overflow-x-auto border-b bg-white dark:bg-gray-900 shadow-sm block lg:hidden pl-4 pr-4">
      <div className="flex gap-x-4 py-2 whitespace-nowrap">
        {categories.map((cat) => (
          <button
            key={cat.href}
            onClick={() => router.push(cat.href)}
            className={clsx(
              "px-3 py-1 rounded-full border text-sm transition whitespace-nowrap",
              pathname === cat.href
                ? "bg-qatar-maroon dark:bg-qatar-maroon text-white dark:text-white border-qatar-maroon dark:border-qatar-maroon"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
