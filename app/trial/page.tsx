'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TrialPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowSpinner(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Trial Components</h1>
        
        {showSpinner ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Tire Spinner Loading</h2>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-24 h-24">
                <Image
                  src="/TireSpinnerLoading.svg"
                  alt="Loading spinner"
                  width={96}
                  height={96}
                  className="animate-spin"
                />
              </div>
              
              <button
                onClick={() => setIsLoading(!isLoading)}
                className="px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon-dark transition-colors"
              >
                Toggle Loading
              </button>

              {isLoading && (
                <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="relative w-16 h-16">
                    <Image
                      src="/TireSpinnerLoading.svg"
                      alt="Loading spinner"
                      width={64}
                      height={64}
                      className="animate-spin"
                    />
                  </div>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">Loading...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center min-h-screen">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
}
