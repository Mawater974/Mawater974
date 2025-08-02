'use client';

import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

type PaymentStepProps = {
  onPaymentSuccess: () => void
  onBack: () => void
  t: (key: string) => string
}

export function PaymentStep({ onPaymentSuccess, onBack, t }: PaymentStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/checkout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('payment.error_processing'));
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || t('payment.unknown_error'));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('payment.order_summary')}
          </h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-300">
                {t('payment.featured_listing')}
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('plans.featured.price')}
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {t('payment.total')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {t('plans.featured.price')}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto"
            disabled={loading}
          >
            {t('common.back')}
          </Button>
          <Button
            type="button"
            onClick={handlePayment}
            className="w-full bg-qatar-gold hover:bg-qatar-gold/90 sm:w-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('payment.processing')}
              </>
            ) : (
              t('payment.pay_now')
            )}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('payment.secure_payment')}
        </p>
      </div>
    </div>
  );
}
