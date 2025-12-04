'use client';

import { useEffect } from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { countryCode: string };
}) {
  const { countries, setCurrentCountry, isLoading } = useCountry();
  const router = useRouter();
  const countryCode = params.countryCode.toUpperCase();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  useEffect(() => {
    if (!isLoading && countries.length > 0) {
      const country = countries.find(c => c.code.toUpperCase() === countryCode);
      
      if (country) {
        // Set the current country and store it in localStorage
        setCurrentCountry(country);
        localStorage.setItem('selectedCountry', JSON.stringify(country));
      } else {
        // If country code is invalid, redirect to home page
        router.push('/');
      }
    }
  }, [countryCode, countries, isLoading, setCurrentCountry, router]);
 
  // Check if the country code is valid
  const isValidCountry = countries.some(c => c.code.toUpperCase() === countryCode);
  if (!isValidCountry) {
    return notFound();
  }

  return children;
}
