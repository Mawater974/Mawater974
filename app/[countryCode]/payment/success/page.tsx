'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Verifying your payment...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('No session ID provided');
      return;
    }

    // Here you would typically verify the payment with your backend
    // For now, we'll just show a success message
    setMessage('Payment successful! Thank you for your purchase.');
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Payment Successful</h1>
        
        {error ? (
          <div className="text-red-600 dark:text-red-400 mb-6">
            {error}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {message}
          </p>
        )}
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Return Home
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/payment-test'}
          >
            Make Another Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
