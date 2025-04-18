'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function ForgotPassword() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      
      // Add type=recovery to the URL instead of options
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password?type=recovery`
      });

      if (error) {
        throw error;
      }

      toast.success(t('auth.forgotPassword.success'));
      setEmail('');
      
      setTimeout(() => {
        router.push('/login?message=reset_email_sent');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(t('auth.forgotPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const response = await fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            countryCode: '--', // Default to Qatar since this is a global page
            userId: user?.id,
            pageType: 'forgot-password'
          })
        });
  
        if (!response.ok) {
          console.error('Failed to track page view:', await response.json());
        }
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };
  
    trackPageView();
  }, [user?.id]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('auth.forgotPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.forgotPassword.subtitle')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {t('auth.forgotPassword.email')}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 rounded-t-md focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon focus:z-10 sm:text-sm"
                placeholder={t('auth.forgotPassword.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('loading')}
                </span>
              ) : (
                t('auth.forgotPassword.button')
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="font-medium text-qatar-maroon hover:text-qatar-maroon-dark"
          >
            {t('auth.forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
