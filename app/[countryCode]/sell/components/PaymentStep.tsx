'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeCardElement, PaymentIntent } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  CardElementProps
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { getFeaturedPricing } from '@/lib/featuredPricing';
import { scrollToTop } from '@/utils/scrollToTop';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentSuccessData {
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  payment_intent_id: string;
  payment_method_id: string;
  payment_session_id?: string | null;
  payment_metadata?: Record<string, any>;
  is_featured: boolean;
}

interface PaymentStepProps {
  formData: FormData;
  onPaymentSuccess?: (data: PaymentSuccessData) => void;
  onPaymentError?: (error: string) => void;
  onContinue?: () => void;
  
}

const PaymentForm = ({ 
  formData, 
  onPaymentSuccess = () => {},
  onPaymentError = (error: string) => toast.error(error || 'Payment failed'),
  onContinue
}: PaymentStepProps) => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
  const { currentCountry } = useCountry();
  const [pricing, setPricing] = useState<{ price: number; currency: string } | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Fetch featured ad pricing when component mounts
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoadingPricing(true);
        const pricingData = await getFeaturedPricing(currentCountry?.id || null);
        
        if (!pricingData) {
          setPricingError('Featured ad pricing not available');
          onPaymentError('Featured ad pricing not configured');
          return;
        }
        
        setPricing({
          price: Number(pricingData.price),
          currency: pricingData.currency_code
        });
        
      } catch (error) {
        console.error('Error fetching featured ad pricing:', error);
        setPricingError('Failed to load pricing');
        onPaymentError('Failed to load payment information');
      } finally {
        setLoadingPricing(false);
      }
    };

    fetchPricing();
  }, [currentCountry?.id, onPaymentError]);
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!pricing) {
      onPaymentError('Pricing information not available');
      return;
    }
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement!,
        billing_details: {
          name: user?.user_metadata?.full_name || user?.email || '',
          email: user?.email || '',
        },
      });

      if (error) {
        onPaymentError(error.message);
        setLoading(false);
        return;
      }

      // Create payment intent on the server with featured ad pricing
      const response = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(pricing.price * 100), // Convert to cents
          currency: pricing.currency,
          metadata: {
            user_id: user?.id,
            payment_type: 'featured_ad',
            country_id: currentCountry?.id || null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

     

      const { clientSecret } = await response.json();

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        onPaymentError?.(confirmError.message);
        setLoading(false);
        return;
      }

      if (!paymentIntent || !paymentIntent.payment_method) {
        onPaymentError?.('No payment intent returned');
        setLoading(false);
        return;
      }

      // Payment successful - use the actual amount from the payment intent
      const successData: PaymentSuccessData = {
        payment_status: paymentIntent.status,
        payment_amount: paymentIntent.amount / 100, // Convert from cents
        payment_currency: paymentIntent.currency.toUpperCase(),
        payment_intent_id: paymentIntent.id,
        payment_method_id: paymentIntent.payment_method, // or paymentIntent.payment_method
        payment_session_id: (paymentIntent as any).latest_charge || null,
        payment_metadata: {
          listing_type: 'car'
        },
        is_featured: true
      };

      // After successful payment
      if (onContinue) {
        onContinue(); // This will update the paymentCompleted state in the parent
      }

      // Add metadata if it exists
      if ('metadata' in paymentIntent && paymentIntent.metadata) {
        successData.payment_metadata = paymentIntent.metadata as Record<string, any>;
      }

      // Update state to show success message
      setPaymentSuccess(true);
      setPaymentData(successData);
      onPaymentSuccess?.(successData);
      setLoading(false);
    } catch (error) {
      onPaymentError(error.message);
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!paymentSuccess) {
      toast.error(t('sell.payment.complete_payment_first') || 'Please complete the payment first');
      scrollToTop();
      return;
    }
    if (onContinue) {
      onContinue();
      scrollToTop();
    }
  };

  // Scroll to top on component mount
  useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-white rounded-lg border-black border shadow">
        <h2 className="text-xl font-semibold mb-4 text-black">{t('sell.payment.title')}</h2>
        <div className="space-y-4">
          {!paymentSuccess ? (
            <>
              <div className="space-y-4">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: 'text-black', 
                        '::placeholder': {
                          color: 'text-black',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }} />
                {loadingPricing ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : pricingError ? (
                  <div className="text-red-500 text-sm">{pricingError}</div>
                ) : pricing ? (
                  <div className="flex justify-between items-center border-b border-black pb-2">
                    {/*<span className="text-black">{t('sell.payment.amount')}: {pricing.currency} {pricing.price.toFixed(2)}</span>*/}
                    <span className="font-semibold text-black">
                    {t('sell.payment.amount')}: {pricing.currency} {pricing.price.toFixed(2)}
                    </span>
                  </div>
                ) : null}
              </div>
              <Button
                type="submit"
                className="w-full bg-qatar-maroon text-white hover:bg-qatar-maroon/90"
                disabled={loading || loadingPricing || !pricing || !!pricingError}
               
              >
                {loading || loadingPricing ? t('common.loading') : t('sell.payment.pay_now')}
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-100 text-green-700 p-4 rounded-lg border">
                <svg className="w-12 h-12 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <h3 className="text-lg font-semibold">{t('sell.payment.success_title') || 'Payment Successful!'}</h3>
                <p className="mt-2">
                  {t('sell.payment.success_message') || 'Your payment has been processed successfully.'}
                </p>
                <p className="mt-2 font-medium">
                  {t('sell.payment.amount')}: {paymentData?.payment_currency} {paymentData?.payment_amount?.toFixed(2)}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  {t('sell.payment.continue_message') || 'You can now continue with your car listing.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </form>
  );
};

export const PaymentStep = ({ 
  formData, 
  onPaymentSuccess = () => {},
  onPaymentError = (error: string) => console.error(error)
}: PaymentStepProps) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        formData={formData} 
        onPaymentSuccess={onPaymentSuccess} 
        onPaymentError={onPaymentError} 
      />
    </Elements>
  );
};